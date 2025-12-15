import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import PlaceholderImg from '../images/placeholder-image.png';
import DataTable from 'datatables.net-react';
import api from '../api/api';
import { CourseDto } from '../dto/CourseDto';
import { AddChapterDto, ChapterDto, UpdateChapterDto } from '../dto/ChapterDto';
import DT from 'datatables.net-dt';
import Swal from 'sweetalert2';

DataTable.use(DT);

const CourseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [countChapter, setCountChapter] = useState<number>(0);
  const [countStudent, setCountStudent] = useState<number>(0);
  const [dataCourse, setDataCourse] = useState<CourseDto>();
  const [dataChapter, setDataChapter] = useState<ChapterDto[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<ChapterDto | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateChapterDto>(
    {} as UpdateChapterDto,
  );
  const [addFormData, setAddFormData] = useState<AddChapterDto>({
    name: '',
    description: '',
    courseId: Number(id),
  });
  const [name, setName] = useState<string>();
  const [desc, setDesc] = useState<string>();

  const style = `
    .swal2-container {
      z-index: 10000;
    }
  `;

  const fetchStudent = async () => {
    try {
      const response = await api.get(`/course/${id}/users`);
      setCountStudent(response.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      const courseResponse = await api.get<CourseDto>(`/course/${id}`);
      setDataCourse(courseResponse.data);
      try {
        const chapterResponse = await api.get<ChapterDto[]>(
          `course/${id}/chapters`,
        );

        fetchStudent();
        setCountChapter(chapterResponse.data.length);
        setDataChapter(chapterResponse.data);
      } catch (chapterError) {
        setDataChapter([]);
        console.error('No chapters found for this course:', chapterError);
      }
    } catch (error) {
      console.error('Error Fetching Data: ', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleClearForm = () => {
    setName(undefined);
    setDesc(undefined);
    setIsEditModalOpen(false);
    setIsAddModalOpen(false);
  };

  const isFormValid = () => {
    if (!name || !desc) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please fill in all required fields (Name, Description).',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      return false;
    }
    return true;
  };

  const handleAddChapter = async () => {
    if (!isFormValid()) {
      return;
    }

    const payload: AddChapterDto = {
      name: name!,
      description: desc!,
      courseId: Number(id),
    };
    try {
      await api.post('/chapter', payload);

      handleClearForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Chapter added successfully.',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchData();
    } catch (error) {
      handleClearForm();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add chapter',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Error adding chapter:', error);
    }
  };

  const handleEditModal = (data: ChapterDto) => {
    setName(data.name);
    setDesc(data.description);
    setIsEditModalOpen(true);
  };

  const handleEditChapter = async (id: number) => {
    const payload: UpdateChapterDto = {
      name: name !== '' ? name : undefined,
      description: desc !== '' ? desc : undefined,
    };

    try {
      await api.put(`/chapter/${id}`, payload);

      handleClearForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Chapter added successfully',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchData();
    } catch (error) {
      handleClearForm();
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add chapter',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Error while updating chapter', error);
    }
  };

  const handleDelete = async (id: number) => {
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
          await api.delete(`/chapter/${id}`);
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Chapter delete successfully',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
          fetchData();
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete chapter',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
          console.error('Error deleting chapter:', error);
        }
      }
    });
  };

  const columns = [
    {
      data: 'name',
      title: 'Name',
      createdCell: (cell: HTMLTableCellElement, cellData: string) => {
        cell.textContent = truncateText(cellData, 5);
      },
    },
    {
      data: 'description',
      title: 'Description',
      createdCell: (cell: HTMLTableCellElement, cellData: string) => {
        cell.textContent = truncateText(cellData, 5);
      },
    },
    { data: 'level', title: 'Chapter' },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      searchable: false,
      createdCell: (
        cell: HTMLTableCellElement,
        _: any,
        rowData: ChapterDto,
      ) => {
        cell.innerHTML = '';

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'flex space-x-2';

        const createButton = (
          buttonColor: string,
          svgPath: string,
          title: string,
          onClick: () => void,
        ) => {
          const button = document.createElement('button');
          button.className = `px-4.5 py-2.5 ${buttonColor} text-white rounded-md`;
          button.title = title;

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

        const materialButton = createButton(
          'bg-success',
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M96 0C43 0 0 43 0 96L0 416c0 53 43 96 96 96l288 0 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l0-64c17.7 0 32-14.3 32-32l0-320c0-17.7-14.3-32-32-32L384 0 96 0zm0 384l256 0 0 64L96 448c-17.7 0-32-14.3-32-32s14.3-32 32-32zm32-240c0-8.8 7.2-16 16-16l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16zm16 48l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>`,
          'Material',
          () => navigate(`/course/${id}/material/${rowData.id}`),
        );

        const assignmentButton = createButton(
          'bg-success',
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM80 64l64 0c8.8 0 16 7.2 16 16s-7.2 16-16 16L80 96c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l64 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-64 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm16 96l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 352c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32zm0 32l0 64 192 0 0-64L96 256zM240 416l64 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-64 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>`,
          'Assignment',
          () => navigate(`/course/${id}/assignment/${rowData.id}`),
        );

        const assessmentButton = createButton(
          'bg-success',
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32l288 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-288 0c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/></svg>`,
          'Assessment',
          () => navigate(`/course/${id}/assessment/${rowData.id}`),
        );

        const editButton = createButton(
          'bg-warning',
          `<path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"/>`,
          'Edit',
          () => handleEditModal(rowData),
        );

        const deleteButton = createButton(
          'bg-danger',
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0L284.2 0c12.1 0 23.2 6.8 28.6 17.7L320 32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 7.2-14.3zM32 128l384 0 0 320c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-320zm96 64c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16z"/></svg>`, // Example SVG for view
          'Delete',
          () => handleDelete(rowData.id),
        );

        buttonContainer.appendChild(materialButton);
        buttonContainer.appendChild(assessmentButton);
        buttonContainer.appendChild(assignmentButton);
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        cell.appendChild(buttonContainer);
      },
    },
  ];

  const truncateText = (text: string, wordLimit: number): string => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + ' ...';
    }
    return text;
  };

  return (
    <div>
      <style>{style}</style>
      <div className="pb-6 text-xl font-semibold">
        <Link to="/course" className="text-blue-500 hover:text-blue-400">
          Course{' '}
        </Link>
        &gt; {dataCourse?.name}
      </div>
      <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
        <h1 className="text-2xl font-bold pb-5">Course Management</h1>
        <hr />
        <div className="flex flex-col sm:flex-row mt-10 sm:gap-5">
          <div className="w-full sm:w-1/3">
            {dataCourse?.image && dataCourse.image !== '' ? (
              <img
                className="w-full h-75 object-cover rounded-lg border"
                src={dataCourse.image}
                alt="gambar"
              />
            ) : (
              <img
                className="w-full h-auto object-cover rounded-lg border"
                src={PlaceholderImg}
                alt="gambar"
              />
            )}
          </div>
          <div className="w-full mt-4 sm:w-2/3 sm:mt-0">
            <div className="mb-2 text-lg font-semibold">
              <table width="100%">
                <tr>
                  <td width="10%">Name</td>
                  <td width="50%">{dataCourse?.name}</td>
                </tr>
                <tr>
                  <td>Code</td>
                  <td>{dataCourse?.code}</td>
                </tr>
                <tr>
                  <td valign="top">Description</td>
                  <td valign="top">{dataCourse?.description}</td>
                </tr>
                <tr>
                  <td>Students</td>
                  <td>{countStudent} Students</td>
                </tr>
                <tr>
                  <td>Chapters</td>
                  <td>{countChapter} Chapters</td>
                </tr>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-between">
          <h1 className="text-2xl font-bold">Course Chapters</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md px-3 py-2 bg-primary text-center font-medium text-white hover:bg-opacity-90"
          >
            Add Chapter
          </button>
        </div>
        <div className="mt-4 max-w-full overflow-x-auto">
          <DataTable
            key={1}
            data={dataChapter}
            columns={columns}
            className="display nowrap w-full"
            options={{
              order: [[2, 'asc']],
              columnDefs: [
                { targets: 0, width: '20%' },
                { targets: 1, width: '40%' },
                { targets: 2, width: '10%' },
                { targets: 3, width: '15%' },
              ],
            }}
          />
        </div>

        {isAddModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-9999">
            <div
              className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
              style={{ width: '800px', maxWidth: '90%' }}
            >
              <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Add Chapter
                </h3>
              </div>
              <div className="flex flex-col gap-5.5 p-6.5">
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
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    placeholder="Input Description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="bg-gray-400 hover:bg-opacity-90 font-medium text-gray-800 py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddChapter}
                    className="bg-primary hover:bg-opacity-90 font-medium text-white py-2 px-4 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isEditModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-9999">
            <div
              className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
              style={{ width: '800px', maxWidth: '90%' }}
            >
              <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                <h3 className="font-medium text-black dark:text-white">
                  Add Chapter
                </h3>
              </div>
              <div className="flex flex-col gap-5.5 p-6.5">
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
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    placeholder="Input Description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="bg-gray-400 hover:bg-opacity-90 font-medium text-gray-800 py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddChapter}
                    className="bg-primary hover:bg-opacity-90 font-medium text-white py-2 px-4 rounded"
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

export default CourseDetail;
