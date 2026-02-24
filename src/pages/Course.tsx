import React, { useEffect, useState } from 'react';
import DataTable from 'datatables.net-react';
import 'datatables.net-dt/css/dataTables.dataTables.min.css';
import PlaceholderImg from '../images/placeholder-image.png';
import { useNavigate } from 'react-router-dom';
import { AddCourseDto, CourseDto, UpdateCourseDto } from '../dto/CourseDto';
import api from '../api/api';
import Swal from 'sweetalert2';
import { supabase } from '../api/supabase';
import { UserDto } from '../dto/UserDto';

const Course: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [userData, setUserData] = useState<UserDto>({} as UserDto);
  const [data, setData] = useState<CourseDto[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [desc, setDesc] = useState<string>('');
  const [courseId, setCourseId] = useState<number | null>(null);

  const fetchUser = async () => {
    try {
      const response = await api.get<UserDto>(`/user/${user.id}`);
      setUserData(response.data);
      await fetchData(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchData = async (currentUserData?: UserDto) => {
    try {
      const response = await api.get<CourseDto[]>('course');
      let courseData = response.data;

      const activeUser = currentUserData || userData;

      if (user.role === 'INSTRUCTOR' && activeUser?.instructorCourses) {
        courseData = courseData.filter(
          (course) => course.id === activeUser.instructorCourses,
        );
      }

      setData(courseData);
      console.log('Fetched course data:', courseData);
    } catch (error) {
      console.error('Error Fetching Data: ', error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleEditModal = (course: CourseDto) => {
    setCourseId(course.id);
    setName(course.name);
    setCode(course.code);
    setDesc(course.description);
    setOldImageUrl(course.image);
    setImagePreview(course.image);
    setIsEditModalOpen(true);
  };

  const handleClearForm = () => {
    setName('');
    setCode('');
    setDesc('');
    setImageFile(null);
    setImagePreview(null);
    setOldImageUrl(null);
    setCourseId(null);
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  const style = `
    .swal2-container {
      z-index: 10000;
    }
  `;

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

  const handleAddCourse = async () => {
    if (!name || !code || !desc) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please fill in Name, Code, and Description.',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    if (!imageFile) {
      Swal.fire('Error', 'Please select an image.', 'error');
      return;
    }

    Swal.fire({ 
      title: 'Saving...', 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });

    const fileName = `${Date.now()}-${imageFile.name}`;
    const filePath = `course/${fileName}`;
    let tempCourseId: number | null = null;

    try {
      // 1. Simpan data awal ke database dengan placeholder image 'pending'
      const payload: AddCourseDto = {
        name: name!,
        code: code!,
        description: desc!,
        image: 'pending',
      };

      const response = await api.post('/course', payload);
      tempCourseId = response.data?.course?.id || response.data?.id || response.data?.data?.id;

      if (!tempCourseId) throw new Error("Server did not return a Course ID");

      // 2. Upload gambar ke Supabase Storage (Bucket: finalproject)
      const { error: uploadError } = await supabase.storage
        .from('finalproject')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 3. Ambil URL Publik secara dinamis (Gunakan getPublicUrl untuk menghindari hardcoded URL)
      const { data: urlData } = supabase.storage.from('finalproject').getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      // 4. Update data Course di backend dengan URL gambar yang sebenarnya
      const imagePayload: UpdateCourseDto = {
        image: imageUrl,
      };

      await api.put(`/course/${tempCourseId}`, imagePayload);

      handleClearForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Course added successfully',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchData();
    } catch (err: any) {
      console.error('Error while adding course: ', err);
      // Rollback data jika upload gagal
      if (tempCourseId) await api.delete(`/course/${tempCourseId}`).catch(() => {});
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to add course',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleEditCourse = async () => {
    if (!name || !code || !desc) {
      Swal.fire('Warning', 'All fields are required!', 'warning');
      return;
    }

    Swal.fire({ 
      title: 'Updating...', 
      allowOutsideClick: false, 
      didOpen: () => Swal.showLoading() 
    });

    let imageUrl = oldImageUrl;

    try {
      if (imageFile) {
        // Hapus file lama di storage jika ada
        if (oldImageUrl) {
          const oldPath = oldImageUrl.split('/finalproject/')[1];
          if (oldPath) {
            await supabase.storage.from('finalproject').remove([oldPath]);
          }
        }

        // Upload file baru
        const fileName = `${Date.now()}-${imageFile.name}`;
        const filePath = `course/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('finalproject')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // Ambil URL publik dinamis
        const { data: urlData } = supabase.storage.from('finalproject').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const updatePayload: UpdateCourseDto = {
        name: name !== '' ? name : undefined,
        code: code !== '' ? code : undefined,
        description: desc !== '' ? desc : undefined,
        image: imageUrl || undefined,
      };

      await api.put(`/course/${courseId}`, updatePayload);

      handleClearForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Course updated successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      fetchData();
    } catch (err: any) {
      console.error('Error while updating course: ', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update course',
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleDeleteCourse = async (id: number, imageUrl?: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Hapus gambar di Supabase Storage
          if (imageUrl) {
            const filePath = imageUrl.split('/finalproject/')[1];
            if (filePath) {
              await supabase.storage.from('finalproject').remove([filePath]);
            }
          }

          // Hapus data di Backend
          await api.delete(`/course/${id}`);
          
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Course has been deleted.',
            timer: 1500,
            showConfirmButton: false,
          });
          fetchData();
        } catch (err) {
          console.error('Error while deleting course: ', err);
          Swal.fire('Error', 'Failed to delete course', 'error');
        }
      }
    });
  };

  const columns = [
    { data: 'name', title: 'Name' },
    { data: 'code', title: 'Code' },
    {
      data: 'createdAt',
      title: 'Created At',
      render: function (data: string | null) {
        if (!data) return '-';
        const date = new Date(data);
        return date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      },
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      searchable: false,
      createdCell: (cell: HTMLTableCellElement, _: any, rowData: CourseDto) => {
        cell.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'flex space-x-2';

        const btnInfo = document.createElement('button');
        btnInfo.className = 'px-3 py-1.5 bg-success text-white rounded-md text-sm';
        btnInfo.innerHTML = 'Info';
        btnInfo.onclick = () => navigate(`/course/${rowData.id}`);

        const btnEdit = document.createElement('button');
        btnEdit.className = 'px-3 py-1.5 bg-warning text-white rounded-md text-sm';
        btnEdit.innerHTML = 'Edit';
        btnEdit.onclick = () => handleEditModal(rowData);

        const btnManage = document.createElement('button');
        btnManage.className = 'px-3 py-1.5 bg-primary text-white rounded-md text-sm';
        btnManage.innerHTML = 'Students';
        btnManage.onclick = () => navigate(`/usercourse/${rowData.id}`);

        const btnDelete = document.createElement('button');
        btnDelete.className = 'px-3 py-1.5 bg-danger text-white rounded-md text-sm';
        btnDelete.innerHTML = 'Delete';
        btnDelete.onclick = () => handleDeleteCourse(rowData.id, rowData.image);

        container.append(btnInfo, btnEdit, btnManage, btnDelete);
        cell.appendChild(container);
      },
    },
  ];

  return (
    <div>
      <style>{style}</style>
      <div className="pb-6 text-xl font-semibold">Course</div>
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Course Management</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-md px-4 py-2 bg-primary text-white font-medium hover:bg-opacity-90 transition"
          >
            + Add Course
          </button>
        </div>
        <hr className="mb-4" />
        <div className="max-w-full overflow-x-auto">
          <DataTable
            data={data}
            columns={columns}
            className="display nowrap w-full"
          />
        </div>

        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-9999 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-boxdark w-full max-w-2xl rounded-lg shadow-xl">
              <div className="border-b border-stroke py-4 px-6.5">
                <h3 className="text-xl font-bold text-black dark:text-white">
                  {isAddModalOpen ? 'Add Course' : 'Edit Course'}
                </h3>
              </div>
              <div className="p-6.5 space-y-4">
                <div>
                  <label className="block mb-2 font-medium">Name</label>
                  <input
                    type="text"
                    placeholder="Course Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Code</label>
                  <input
                    type="text"
                    placeholder="Course Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Description</label>
                  <textarea
                    placeholder="Course Description"
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full mb-3"
                  />
                  <img
                    src={imagePreview || PlaceholderImg}
                    className="w-full h-56 object-cover rounded-lg border border-stroke shadow-inner"
                    alt="Preview"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-stroke mt-4">
                  <button
                    onClick={handleClearForm}
                    className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-opacity-80"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isAddModalOpen ? handleAddCourse : handleEditCourse}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Course;