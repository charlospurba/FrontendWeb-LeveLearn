import { Link, useParams } from 'react-router-dom';
import api from '../api/api';
import { CourseDto } from '../dto/CourseDto';
import { useEffect, useState } from 'react';
import { AssessmentDto, Question } from '../dto/AssessmentDto';
import { UserDto } from '../dto/UserDto';

const DetailResponse = () => {
  const { courseId, assessId, userId } = useParams();
  const [dataCourse, setDataCourse] = useState<CourseDto>();
  const [dataAssess, setDataAssess] = useState<AssessmentDto>();
  const [dataUser, setDataUser] = useState<UserDto>({} as UserDto);
  const [allQuestion, setAllQuestion] = useState<Question[]>([]);
  const [allAnswer, setAllAnswer] = useState<string[]>([]);
  const letters: string = 'abcdefghijklmnopqrstuvwxyz';

  const fetchUser = async () => {
    try {
      const response = await api.get<UserDto>(`/user/${userId}`);
      setDataUser(response.data);
    } catch (error) {
      console.error('Error while fetching user', error);
    }
  };

  const fetchUserResponse = async (id: number) => {
    try {
      const response = await api.get(`/userchapter/${userId}/${id}`);

      if (response.data[0] && response.data[0].assessmentAnswer) {
        const parseAnswer = JSON.parse(response.data[0].assessmentAnswer);
        setAllAnswer(parseAnswer);
      }
    } catch (error) {
      console.error('Error while fetching user response', error);
    }
  };

  const fetchCourse = async () => {
    try {
      const response = await api.get<CourseDto>(`/course/${courseId}`);
      setDataCourse(response.data);
    } catch (error) {
      console.error('Error while fetching course', error);
    }
  };

  const fetchAssess = async () => {
    try {
      const response = await api.get<AssessmentDto>(`/assessment/${assessId}`);
      setDataAssess(response.data);
      if (response.data.id && response.data.questions) {
        const parsedQuestions: Question[] = JSON.parse(response.data.questions);
        setAllQuestion(parsedQuestions);
        fetchUserResponse(response.data.chapterId).then;
      }
    } catch (error) {
      console.error('Error while fetching assessment', error);
    }
  };

  useEffect(() => {
    fetchCourse();
    fetchAssess();
    fetchUser();
  }, []);

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
        &gt;{' '}
        <Link
          to={`/course/${courseId}/assessment/${assessId}/response`}
          className="text-blue-500 hover:text-blue-400"
        >
          Response
        </Link>{' '}
        &gt; Detail
      </div>
      <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
        {/* <style>{selectStyle}</style> */}
        <h1 className="text-2xl font-bold pb-5">
          Assessment Response Management
        </h1>
        <hr />
        <div className="mt-4 grid grid-cols-2 gap-1">
          <div className="p-2 bg-slate-100 text-center">{dataUser.name}</div>
          <div className="p-2 bg-slate-100 text-center">
            {dataUser.studentId}
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-4">
          {/* title */}
          <div>{dataAssess?.instruction}</div>
          {/* pertanyaan */}
          {allQuestion.map((item, index) => (
            <div key={index} className="border p-4">
              <div className="">
                <b>Type</b> {item.type === 'MC' ? 'Multiple Choice' : 'Essay'}
              </div>
              <div className="mt-2">{item.question}</div>
              {item.type === 'MC' ? (
                <div className="mt-2">
                  {item.options?.map((opt, idx) => (
                    <div
                      className={
                        allAnswer[index] === opt &&
                        allAnswer[index] === item.answer
                          ? `font-bold text-success`
                          : allAnswer[index] === opt && allAnswer[index]
                          ? `font-bold text-danger`
                          : ``
                      }
                      key={idx}
                    >
                      {letters.charAt(idx)}. {opt}
                    </div>
                  ))}
                </div>
              ) : (
                <div></div>
              )}
              {item.type === 'MC' ? (
                <div>
                  <div className="mt-2">Jawaban: </div>
                  <div className="mt-2 font-bold">{item.answer}</div>
                </div>
              ) : (
                <div>
                  <div className="mt-2">{allAnswer[index]}</div>
                  <div className="mt-2">Jawaban: </div>
                  <div className="mt-2 font-bold">{item.answer}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailResponse;
