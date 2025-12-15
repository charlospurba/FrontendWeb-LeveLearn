import DataTable from 'datatables.net-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';
import { CourseDto } from '../dto/CourseDto';
import { useEffect, useState } from 'react';
import { AssessmentDto } from '../dto/AssessmentDto';
import { AssessResponseDto } from '../dto/AssessResponseDto';

const AssessmentResponse: React.FC = () => {
  const { courseId, assessId } = useParams();
  const [dataCourse, setDataCourse] = useState<CourseDto>({} as CourseDto);
  const navigate = useNavigate();
  const [dataAssessResponse, setDataAssessResponse] = useState<AssessResponseDto[]>([]);

  const fetchCourse = async () => {
    try {
      const response = await api.get<CourseDto>(`/course/${courseId}`);
      setDataCourse(response.data);
    } catch (error) {
      console.error('Error while fetching course data', error)
    }
  };

  const fetchAssess = async() => {
    try {
      const response = await api.get<AssessmentDto>(`/assessment/${assessId}`);
      fetchAssessResponse(response.data.chapterId)
    } catch (error) {
      console.error('Error while fetching assessment data', error);
    }
  }

  const fetchAssessResponse = async (id: number) => {
    try {
      const response = await api.get<AssessResponseDto[]>(`/chapter/${id}/userchapter`);
      setDataAssessResponse(response.data);
    } catch (error) {
      console.error('Error while fetching assessment response data', error);
    }
  }

  useEffect(() => {
    fetchCourse();
    fetchAssess();
  }, [assessId, courseId]);

  const columns = [
    { data: 'user.name', title: 'Name' },
    {
      data: 'user.studentId',
      title: 'Student ID',
    },
    {
      data: 'assessmentDone',
      title: 'Status',
      createdCell: (cell: HTMLTableCellElement, cellData: string) => {
        cell.textContent = !!cellData === true ? 'FINISHED' : 'UNFINISHED'; 
      },
    },
    {
      data: 'assessmentGrade',
      title: 'Score',
    },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      searchable: false,
      createdCell: (cell: HTMLTableCellElement, _: any, rowData: AssessResponseDto) => {
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
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512"><path d="M48 80a48 48 0 1 1 96 0A48 48 0 1 1 48 80zM0 224c0-17.7 14.3-32 32-32l64 0c17.7 0 32 14.3 32 32l0 224 32 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 512c-17.7 0-32-14.3-32-32s14.3-32 32-32l32 0 0-192-32 0c-17.7 0-32-14.3-32-32z"/></svg>`,
          'Info',
          () => navigate(`/course/${courseId}/assessment/${assessId}/response/${rowData.userId}`),
        );

        // const editButton = createButton(
        //   'bg-warning',
        //   `<path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"/>`,
        //   'Edit',
        //   () => {},
        // );

        buttonContainer.appendChild(infoButton);

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
          to={`/course/${courseId}/assessment/${assessId}`}
          className="text-blue-500 hover:text-blue-400"
        >
          Assessment
        </Link>{' '}
        &gt; Response
      </div>
      <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
        {/* <style>{selectStyle}</style> */}
        <h1 className="text-2xl font-bold pb-5">Assessment Response Management</h1>
        <hr />
        <div className="max-w-full overflow-x-auto ">
          <DataTable
            data={dataAssessResponse}
            columns={columns}
            className="display nowrap w-full"
            options={{
              order: [[5, 'desc']],
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AssessmentResponse;
