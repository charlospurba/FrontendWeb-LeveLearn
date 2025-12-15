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
import { User } from '@supabase/supabase-js';

const Course: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '');
  const [userData, setUserData] = useState<UserDto>({} as UserDto);
  const [data, setData] = useState<CourseDto[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [name, setName] = useState<string>();
  const [code, setCode] = useState<string>();
  const [desc, setDesc] = useState<string>();
  const [courseId, setCourseId] = useState<number>();


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

      if (user.role === 'INSTRUCTOR' && currentUserData?.instructorCourses) {
        courseData = courseData.filter(
          (course) => course.id === currentUserData.instructorCourses,
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

  const handleEditModal = (data: CourseDto) => {
    setCourseId(data.id);
    setName(data.name);
    setCode(data.code);
    setDesc(data.description);
    setOldImageUrl(data.image);
    setImagePreview(data.image);
    setIsEditModalOpen(true);
  };

  const handleClearForm = () => {
    setName(undefined);
    setCode(undefined);
    setDesc(undefined);
    setImageFile(null);
    setImagePreview(null);
    setOldImageUrl(null);
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  const style = `
    .swal2-container {
      z-index: 10000;
    }
  `;

  const isFormValid = () => {
    if (!name || !code || !desc) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please fill in all required fields (Name, Code, Description).',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      return false;
    }
    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Membuat URL untuk preview
    } else {
      setImageFile(null);
      setImagePreview(null); // Menghapus preview jika tidak ada file
    }
  };

  const handleAddCourse = async () => {
    if (!isFormValid()) {
      return;
    }

    if (!imageFile) {
      alert('Please select an image.');
      return;
    }

    const fileName = `${Date.now()}-${imageFile.name}`;
    const filePath = `course/${fileName}`;

    try {
      const payload: AddCourseDto = {
        name: name!,
        code: code!,
        description: desc!,
        image: '',
      };

      const response = await api.post('/course', payload);

      // SQL berhasil, lanjutkan dengan upload gambar
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('finalproject')
        .upload(filePath, imageFile);

      if (uploadError) {
        if (uploadError instanceof Error) {
          console.error('Error uploading image:', uploadError.message);
        } else {
          console.error('Unknown error uploading image:', uploadError);
        }
        handleClearForm();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to upload image',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        await api.delete(`/course/${response.data.course.id}`);
        return;
      }

      const imageUrl = `https://msvsocwvhpxfnfhjewar.supabase.co/storage/v1/object/public/finalproject/${filePath}`;

      const imagePayload: UpdateCourseDto = {
        image: imageUrl,
      };

      await api.put<UpdateCourseDto>(
        `/course/${response.data.course.id}`,
        imagePayload,
      );

      handleClearForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Course added successfully',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchData();
    } catch (err) {
      handleClearForm();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add course',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Error while adding course: ', err);
    }
  };

  const handleEditCourse = async () => {
    let imageUrl = oldImageUrl;

    if (imageFile) {
      if (oldImageUrl) {
        try {
          const oldFilePath = oldImageUrl.split('/finalproject/')[1];
          if (oldFilePath) {
            const { error: deleteError } = await supabase.storage
              .from('finalproject')
              .remove([oldFilePath]);

            if (deleteError) {
              console.error('Error deleting old image:', deleteError);
              alert('Failed to delete old image.');
              return;
            }
          }
        } catch (deleteErr) {
          handleClearForm();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete old image',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
          console.error('Error deleting old image:', deleteErr);
          return;
        }
      }

      const fileName = `${Date.now()}-${imageFile.name}`;
      const filePath = `course/${fileName}`;

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('finalproject')
          .upload(filePath, imageFile);

        if (uploadError) {
          handleClearForm();
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to upload new image',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
          console.error('Error uploading new image:', uploadError);
          return;
        }

        imageUrl = `https://msvsocwvhpxfnfhjewar.supabase.co/storage/v1/object/public/finalproject/${filePath}`;
      } catch (uploadErr) {
        handleClearForm();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to upload new image',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        console.error('Error uploading new image:', uploadErr);
        return;
      }
    }

    const uploadData: UpdateCourseDto = {
      name: name !== '' ? name : undefined,
      code: code !== '' ? code : undefined,
      description: desc !== '' ? desc : undefined,
      image: imageUrl || undefined,
    };

    try {
      await api.put(`/course/${courseId}`, uploadData);

      handleClearForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Course updated successfully.',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchData();
    } catch (err) {
      handleClearForm();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update course',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Error while updating course: ', err);
    }
  };

  const handleDeleteCourse = async (id: number, imageUrl?: string) => {
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
          if (imageUrl) {
            const oldFilePath = imageUrl.split('/finalproject/')[1];
            if (oldFilePath) {
              const { error: deleteStorageError } = await supabase.storage
                .from('finalproject')
                .remove([oldFilePath]);

              if (deleteStorageError) {
                handleClearForm();
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'Failed to delete image',
                  timer: 1500,
                  timerProgressBar: true,
                  showConfirmButton: false,
                });
                console.error(
                  'Error deleting image from storage:',
                  deleteStorageError,
                );
                return;
              }
            }
          }

          await api.delete(`/course/${id}`);
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Chapter delete successfully',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
          fetchData();
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete course',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
          console.error('Error while deleting badge: ', err);
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

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex space-x-2';

        const createButton = (
          buttonColor: string,
          svgPath: string,
          onClick: () => void,
        ) => {
          const button = document.createElement('button');
          button.className = `px-4.5 py-2.5 ${buttonColor} text-white rounded-md`; // Adjust styles as needed

          const svg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg',
          );
          svg.setAttribute('viewBox', '0 0 512 512');
          svg.setAttribute('width', '20');
          svg.setAttribute('height', '20');
          svg.setAttribute('fill', 'white');
          svg.innerHTML = svgPath;

          button.appendChild(svg);
          button.onclick = onClick;
          return button;
        };

        const manageButton = createButton(
          'bg-primary',
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464l349.5 0c-8.9-63.3-63.3-112-129-112l-91.4 0c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3z"/></svg>`, // Example SVG for view
          () => navigate(`/usercourse/${rowData.id}`),
        );

        const editButton = createButton(
          'bg-warning',
          `<path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"/>`,
          () => handleEditModal(rowData),
        );

        const deleteButton = createButton(
          'bg-danger',
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0L284.2 0c12.1 0 23.2 6.8 28.6 17.7L320 32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 7.2-14.3zM32 128l384 0 0 320c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-320zm96 64c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16z"/></svg>`, // Example SVG for view
          () => handleDeleteCourse(rowData.id, rowData.image),
        );

        const infoButton = createButton(
          'bg-success',
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512"><path d="M48 80a48 48 0 1 1 96 0A48 48 0 1 1 48 80zM0 224c0-17.7 14.3-32 32-32l64 0c17.7 0 32 14.3 32 32l0 224 32 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 512c-17.7 0-32-14.3-32-32s14.3-32 32-32l32 0 0-192-32 0c-17.7 0-32-14.3-32-32z"/></svg>`,
          () => navigate(`/course/${rowData.id}`),
        );

        buttonContainer.appendChild(infoButton);
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(manageButton);
        buttonContainer.appendChild(deleteButton);

        cell.appendChild(buttonContainer);
      },
    },
  ];

  return (
    <div>
      <style>{style}</style>
      <div className="pb-6 text-xl font-semibold">Course</div>
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h1 className="text-2xl font-bold pb-5">Course Management</h1>
        <hr />
        <div className="text-end mt-6">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md px-3 py-2 bg-primary text-center font-medium text-white hover:bg-opacity-90"
          >
            Add Course
          </button>
        </div>
        <div className="max-w-full overflow-x-auto ">
          <DataTable
            data={data}
            columns={columns}
            className="display nowrap w-full"
          />
        </div>

        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-9999 overflow-y-auto">
            <div
              className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
              style={{ width: '800px', maxWidth: '90%' }}
            >
              <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Add Course
                </h3>
              </div>
              <div className="flex flex-col p-6.5">
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Input Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="code"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    placeholder="Input Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="desc"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Description
                  </label>
                  <textarea
                    name="desc"
                    id="desc"
                    placeholder="Input Description"
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="image"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Image
                  </label>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    className="w-full rounded-md border border-stroke p-3 outline-none transition file:mr-4 file:rounded file:border-[0.5px] file:border-stroke file:bg-[#EEEEEE] file:py-1 file:px-2.5 file:text-sm focus:border-primary file:focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-strokedark dark:file:bg-white/30 dark:file:text-white"
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="border w-full h-60 object-cover rounded-lg mt-5"
                    />
                  ) : (
                    <img
                      src={PlaceholderImg}
                      alt="Placeholder"
                      className="border w-full h-60 object-cover rounded-lg mt-5"
                    />
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="bg-gray-400 hover:bg-opacity-90 text-gray-800 font-medium py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCourse}
                    className="bg-primary hover:bg-opacity-90 text-white font-medium py-2 px-4 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-9999 overflow-y-auto">
            <div
              className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
              style={{ width: '800px', maxWidth: '90%' }}
            >
              <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Add Course
                </h3>
              </div>
              <div className="flex flex-col p-6.5">
                <div className="mb-4">
                  <label
                    htmlFor="name"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Input Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="code"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    placeholder="Input Code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="desc"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Description
                  </label>
                  <textarea
                    name="desc"
                    id="desc"
                    placeholder="Input Description"
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="image"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Image
                  </label>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    className="w-full rounded-md border border-stroke p-3 outline-none transition file:mr-4 file:rounded file:border-[0.5px] file:border-stroke file:bg-[#EEEEEE] file:py-1 file:px-2.5 file:text-sm focus:border-primary file:focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-strokedark dark:file:bg-white/30 dark:file:text-white"
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="border w-full h-60 object-cover rounded-lg mt-5"
                    />
                  ) : (
                    <img
                      src={PlaceholderImg}
                      alt="Placeholder"
                      className="border w-full h-60 object-cover rounded-lg mt-5"
                    />
                  )}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="bg-gray-400 hover:bg-opacity-90 text-gray-800 font-medium py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditCourse}
                    className="bg-primary hover:bg-opacity-90 text-white font-medium py-2 px-4 rounded"
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
