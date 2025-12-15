import { Link, useParams } from 'react-router-dom';
import api from '../api/api';
import { CourseDto } from '../dto/CourseDto';
import { useEffect, useState } from 'react';
import DataTable from 'datatables.net-react';
import { AssignmentDto } from '../dto/AssignmentDto';
import { AssessResponseDto } from '../dto/AssessResponseDto';
import Swal from 'sweetalert2';

const AssignmentResponse = () => {
  const { courseId, assignId } = useParams();
  const [dataCourse, setDataCourse] = useState<CourseDto>();
  const [dataAssignResponse, setDataAssignResponse] = useState<
    AssessResponseDto[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [score, setScore] = useState<number>();
  const [feedback, setFeedback] = useState<string>();
  const [userchapterId, setUserchapterId] = useState<number>();

  const fetchCourse = async () => {
    try {
      const response = await api.get<CourseDto>(`/course/${courseId}`);
      setDataCourse(response.data);
    } catch (error) {
      console.error('Error while fetching course', error);
    }
  };

  const fetchAssign = async () => {
    try {
      const response = await api.get<AssignmentDto>(`/assignment/${assignId}`);
      fetchAssignResponse(response.data.chapterId).then();
    } catch (error) {
      console.error('Error while fetching assignment', error);
    }
  };

  const fetchAssignResponse = async (id: number) => {
    try {
      const response = await api.get<AssessResponseDto[]>(
        `/chapter/${id}/userchapter`,
      );
      setDataAssignResponse(response.data);
    } catch (error) {
      console.error('Error while fetching assignment response', error);
    }
  };

  const handleClearForm = () => {
    setScore(undefined);
    setFeedback(undefined);
    setIsModalOpen(false);
    setUserchapterId(undefined);
  };

  const handleOpenModal = (data: AssessResponseDto) => {
    setScore(data.assignmentScore);
    setFeedback(data.assignmentFeedback);
    setUserchapterId(data.id);
    setIsModalOpen(true);
  };

  const handleEvaluateAssignment = async () => {
    const payload = {
      assignmentScore: score,
      assignmentFeedback: feedback,
    };

    try {
      await api.put(`/userchapter/${userchapterId}`, payload);
      handleClearForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Successfully evaluate assignment',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchAssign();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to evaluate assignment',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Error while updating assignment evaluation', error);
    }
  };

  useEffect(() => {
    fetchCourse();
    fetchAssign();
  }, []);

  const truncateText = (text: string, wordLimit: number): string => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + ' ...';
    }
    return text;
  };

  const columns = [
    { data: 'user.name', title: 'Name' },
    {
      data: 'user.studentId',
      title: 'Student ID',
    },
    {
      data: 'assignmentDone',
      title: 'Status',
      createdCell: (cell: HTMLTableCellElement, cellData: string) => {
        cell.textContent = !!cellData === true ? 'FINISHED' : 'UNFINISHED';
      },
    },
    {
      data: 'assignmentScore',
      title: 'Score',
    },
    {
      data: 'assignmentFeedback',
      title: 'Feedback',
      createdCell: (cell: HTMLTableCellElement, cellData: string) => {
        cell.textContent = truncateText(cellData, 4);
      },
    },
    {
      data: null,
      title: 'Action',
      orderable: false,
      searchable: false,
      createdCell: (
        cell: HTMLTableCellElement,
        _: any,
        rowData: AssessResponseDto,
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

        const infoButton = createButton(
          'bg-success',
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>`,
          'Info',
          () => {
            if (rowData.submission) {
              window.open(rowData.submission, '_blank');
            } else {
              alert('No Submission Found');
            }
          },
        );

        const evaluateButton = createButton(
          'bg-success',
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M368.4 18.3L312.7 74.1 437.9 199.3l55.7-55.7c21.9-21.9 21.9-57.3 0-79.2L447.6 18.3c-21.9-21.9-57.3-21.9-79.2 0zM288 94.6l-9.2 2.8L134.7 140.6c-19.9 6-35.7 21.2-42.3 41L3.8 445.8c-3.8 11.3-1 23.9 7.3 32.4L164.7 324.7c-3-6.3-4.7-13.3-4.7-20.7c0-26.5 21.5-48 48-48s48 21.5 48 48s-21.5 48-48 48c-7.4 0-14.4-1.7-20.7-4.7L33.7 500.9c8.6 8.3 21.1 11.2 32.4 7.3l264.3-88.6c19.7-6.6 35-22.4 41-42.3l43.2-144.1 2.7-9.2L288 94.6z"/></svg>`,
          'Info',
          () => handleOpenModal(rowData),
        );

        buttonContainer.appendChild(infoButton);
        buttonContainer.appendChild(evaluateButton);

        cell.appendChild(buttonContainer);
      },
    },
  ];

  return (
    <div>
      <div className="pb-6 text-xl font-semibold">
        <Link to="/course" className="text-blue-500 hover:text-blue-400">
          Course
        </Link>{' '}
        &gt;{' '}
        <Link
          to={`/course/${courseId}`}
          className="text-blue-500 hover:text-blue-400"
        >
          {dataCourse?.name}
        </Link>{' '}
        &gt;{' '}
        <Link
          to={`/course/${courseId}/assignment/${assignId}`}
          className="text-blue-500 hover:text-blue-400"
        >
          Assignment
        </Link>{' '}
        &gt; Response
      </div>
      <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
        {/* <style>{selectStyle}</style> */}
        <h1 className="text-2xl font-bold pb-5">
          Assignment Response Management
        </h1>
        <hr />
        <div className="max-w-full overflow-x-auto ">
          <DataTable
            data={dataAssignResponse}
            columns={columns}
            className="display nowrap w-full"
            options={{
              order: [[5, 'desc']],
            }}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-9999">
          <div
            className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            style={{ width: '800px', maxWidth: '90%' }}
          >
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Manage Score
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <div>
                <div className="mb-4">
                  <label
                    htmlFor="score"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Score
                  </label>
                  <input
                    type="number"
                    id="score"
                    name="score"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    placeholder="Input Score"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="feedback"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Feedback
                  </label>
                  <textarea
                    rows={3}
                    name="feedback"
                    id="feedback"
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    placeholder="Input Name"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => handleClearForm()}
                    className="bg-gray-400 hover:bg-opacity-90 text-gray-800 font-medium py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEvaluateAssignment().then()}
                    className="bg-primary hover:bg-opacity-90 text-white font-medium py-2 px-4 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentResponse;
