import DataTable from 'datatables.net-react';
import { useEffect, useState } from 'react';
import { AddBadgeDto, BadgeDto, UpdateBadgeDto } from '../dto/BadgeDto';
import api from '../api/api';
import { CourseDto } from '../dto/CourseDto';
import { ChapterDto, UpdateChapterDto } from '../dto/ChapterDto';
import PlaceholderImg from '../images/placeholder-image.png';
import { supabase } from '../api/supabase';
import Swal from 'sweetalert2';

const Badge: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [data, setData] = useState<BadgeDto[]>([]);
  const [course, setCourse] = useState<CourseDto[]>([]);
  const [chapter, setChapter] = useState<ChapterDto[]>([]);
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCE'>(
    'BEGINNER',
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<number>(0);
  const [chapterId, setChapterId] = useState<number>(0);
  const [badgeId, setBadgeId] = useState<number>(0);

  const selectStyle = `
  .custom-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M8 10l4 4 4-4'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 30px;
    padding-right: 28px;
  }`;

  const fetchData = async () => {
    try {
      const response = await api.get<BadgeDto[]>('/badge');
      setData(response.data);
    } catch (err) {
      console.error('Error while getting badge: ', err);
    }
  };

  const fetchCourse = async () => {
    try {
      const response = await api.get<CourseDto[]>('/course');
      setCourse(response.data);
    } catch (err) {
      console.error('Error while getting course: ', err);
    }
  };

  const fetchChapters = async (courseId: number | undefined) => {
    try {
      if (courseId) {
        const response = await api.get<ChapterDto[]>(
          `/course/${courseId}/chapters`,
        );
        setChapter(response.data);
      } else {
        setChapter([]);
      }
    } catch (err) {
      console.error('Error while getting chapter: ', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCourse();
  }, []);

  useEffect(() => {
    fetchChapters(courseId);
  }, [courseId]);

  const handleClearForm = () => {
    setName('');
    setType('BEGINNER');
    setCourseId(0);
    setChapterId(0);
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setImageFile(null);
    setImagePreview(null);
    setOldImageUrl(null);
  };

  const handleEditModal = (data: BadgeDto) => {
    setBadgeId(data.id);
    setName(data.name);
    setType(data.type);
    setCourseId(data.courseId);
    setChapterId(data.chapterId);
    setOldImageUrl(data.image);
    
    // Validasi Image Preview agar tidak crash jika link kosong/rusak
    const safeImageUrl = data.image?.startsWith('http') ? data.image : PlaceholderImg;
    setImagePreview(safeImageUrl);
    
    setIsEditModalOpen(true);
  };

  const truncateText = (text: string, wordLimit: number): string => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + ' ...';
    }
    return text;
  };

  const handleAddBadge = async () => {
    if (!imageFile) {
      Swal.fire('Warning', 'Please select an image.', 'warning');
      return;
    }

    Swal.fire({ title: 'Saving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      // 1. Upload ke Supabase Terlebih Dahulu
      const fileName = `${Date.now()}-${imageFile.name}`;
      const filePath = `badge/${chapterId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('finalproject')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. Ambil URL Dinamis dari Supabase
      const { data: urlData } = supabase.storage.from('finalproject').getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      // 3. Simpan data badge ke Database backend lengkap dengan URL-nya
      const uploadBadgeData: AddBadgeDto = {
        name: name,
        type: type,
        courseId: courseId,
        chapterId: chapterId,
        image: imageUrl, // URL langsung masuk, tidak pakai 'pending'
      };

      await api.post('/badge', uploadBadgeData);

      // 4. Update Chapter Checkpoint logic
      let checkpoint = type === 'BEGINNER' ? 1 : type === 'INTERMEDIATE' ? 2 : 3;
      await api.put(`/chapter/${chapterId}`, { isCheckpoint: checkpoint });

      handleClearForm();
      Swal.fire({ icon: 'success', title: 'Success', text: 'Badge added successfully.', timer: 1500, showConfirmButton: false });
      fetchData(); // Refresh table
    } catch (err: any) {
      Swal.fire('Error', err.message || 'Failed to add badge', 'error');
    }
  };

  const handleEditBadge = async () => {
    Swal.fire({ title: 'Updating...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    let imageUrl = oldImageUrl;

    try {
      if (imageFile) {
        // Hapus file gambar lama di Supabase jika ada
        if (oldImageUrl && oldImageUrl.includes('/finalproject/')) {
          const oldPath = oldImageUrl.split('/finalproject/')[1];
          if (oldPath) await supabase.storage.from('finalproject').remove([oldPath]);
        }

        // Upload file gambar baru
        const fileName = `${Date.now()}-${imageFile.name}`;
        const filePath = `badge/${chapterId}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('finalproject').upload(filePath, imageFile);
        if (uploadError) throw uploadError;

        // Ambil URL public yang baru
        imageUrl = supabase.storage.from('finalproject').getPublicUrl(filePath).data.publicUrl;
      }

      // Update Database
      const uploadData: UpdateBadgeDto = {
        name: name !== '' ? name : undefined,
        type: type,
        courseId: courseId,
        chapterId: chapterId,
        image: imageUrl || undefined,
      };

      await api.put(`/badge/${badgeId}`, uploadData);

      let checkpoint = type === 'BEGINNER' ? 1 : type === 'INTERMEDIATE' ? 2 : 3;
      await api.put(`/chapter/${chapterId}`, { isCheckpoint: checkpoint });

      handleClearForm();
      Swal.fire({ icon: 'success', title: 'Success', text: 'Badge updated successfully.', timer: 1500, showConfirmButton: false });
      fetchData(); // Refresh table
    } catch (err: any) {
      Swal.fire('Error', 'Update failed', 'error');
    }
  };

  const handleDeleteBadge = async (id: number, imageUrl?: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (imageUrl && imageUrl.includes('/finalproject/')) {
            const oldFilePath = imageUrl.split('/finalproject/')[1];
            if (oldFilePath) {
              await supabase.storage.from('finalproject').remove([oldFilePath]);
            }
          }
          await api.delete(`/badge/${id}`);
          Swal.fire('Deleted!', 'Badge has been deleted.', 'success');
          fetchData();
        } catch (err) {
          Swal.fire('Error', 'Delete failed', 'error');
        }
      }
    });
  };

  // TAMBAHAN KOLOM IMAGE AGAR TAMPIL DI TABEL ADMIN
  const columns = [
    {
      data: 'image',
      title: 'Image',
      orderable: false,
      searchable: false,
      render: (data: string) => {
        const imgUrl = data && data.startsWith('http') ? data : PlaceholderImg;
        return `<img src="${imgUrl}" alt="Badge" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" onerror="this.src='${PlaceholderImg}'"/>`;
      },
    },
    { data: 'name', title: 'Name' },
    { data: 'type', title: 'Type' },
    {
      data: 'course.name',
      title: 'Course',
      render: (data: string) => truncateText(data, 5),
    },
    {
      data: 'chapter.name',
      title: 'Chapter',
      render: (data: string) => truncateText(data, 5),
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      searchable: false,
      createdCell: (cell: HTMLTableCellElement, _: any, rowData: BadgeDto) => {
        cell.innerHTML = '';
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex space-x-2';

        const btnEdit = document.createElement('button');
        btnEdit.className = 'px-3 py-1.5 bg-warning text-white rounded-md text-sm';
        btnEdit.innerHTML = 'Edit';
        btnEdit.onclick = () => handleEditModal(rowData);

        const btnDel = document.createElement('button');
        btnDel.className = 'px-3 py-1.5 bg-danger text-white rounded-md text-sm';
        btnDel.innerHTML = 'Delete';
        btnDel.onclick = () => handleDeleteBadge(rowData.id, rowData.image);

        buttonContainer.append(btnEdit, btnDel);
        cell.appendChild(buttonContainer);
      },
    },
  ];

  return (
    <div>
      <div className="pb-6 text-xl font-semibold">Badge</div>
      <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
        <style>{selectStyle}</style>
        <div className="flex justify-between items-center pb-5">
            <h1 className="text-2xl font-bold">Badge Management</h1>
            <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-md">+ Add Badge</button>
        </div>
        <hr />
        
        <div className="max-w-full overflow-x-auto mt-6">
          <DataTable data={data} columns={columns} className="display nowrap w-full" options={{ order: [[1, 'asc']] }} />
        </div>

        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-9999 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-boxdark w-full max-w-2xl rounded-lg shadow-xl">
              <div className="p-6 border-b border-stroke">
                <h3 className="text-xl font-bold text-black dark:text-white">{isAddModalOpen ? 'Add Badge' : 'Edit Badge'}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block mb-2 font-medium">Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-form-input outline-none" placeholder="Input Name" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value as any)} className="custom-select w-full p-3 border rounded-lg dark:bg-form-input outline-none">
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCE">ADVANCE</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Course</label>
                  <select value={courseId} onChange={(e) => setCourseId(Number(e.target.value))} className="custom-select w-full p-3 border rounded-lg dark:bg-form-input outline-none">
                    <option value={0}>Pilih Course</option>
                    <option value={0} disabled>---</option>
                    {course.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Chapter</label>
                  <select value={chapterId} onChange={(e) => setChapterId(Number(e.target.value))} className="custom-select w-full p-3 border rounded-lg dark:bg-form-input outline-none">
                    <option value={0}>Pilih Chapter</option>
                    <option value={0} disabled>---</option>
                    {chapter.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Image</label>
                  <input type="file" onChange={handleImageChange} className="w-full mb-3" accept="image/*" />
                  <img src={imagePreview || PlaceholderImg} className="w-full h-64 object-contain rounded-lg border shadow-inner bg-gray-50" />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button onClick={handleClearForm} className="px-6 py-2 bg-gray-300 rounded-lg">Cancel</button>
                  <button onClick={isAddModalOpen ? handleAddBadge : handleEditBadge} className="px-6 py-2 bg-primary text-white rounded-lg">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Badge;