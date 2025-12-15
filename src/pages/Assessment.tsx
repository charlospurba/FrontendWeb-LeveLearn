import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AssessmentDto, Question } from '../dto/AssessmentDto';
import { CourseDto } from '../dto/CourseDto';
import Swal from 'sweetalert2';

const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, id } = useParams();
  const [dataCourse, setDataCourse] = useState<CourseDto>();
  const [instruction, setInstruction] = useState<string>('');
  const [assessId, setAssessId] = useState<number>();
  const [assessmentExist, setAssessmentExist] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<string>('MC');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editInstruction, setEditInstruction] = useState<string>('');
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newOptionText, setNewOptionText] = useState<string>('');
  const [newAnswerText, setNewAnswerText] = useState<string>('');
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);

  const optionList = 'abcdefghijklmnopqrstuvwxyz';

  const selectStyle = `
  .custom-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M8 10l4 4 4-4'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 30px;
    padding-right: 28px;
  }`;

  const fetchCourse = async () => {
    const responseCourse = await api.get<CourseDto>(`/course/${courseId}`);
    if (responseCourse.data?.id) {
      setDataCourse(responseCourse.data);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<AssessmentDto>(
        `/chapter/${id}/assessments`,
      );
      console.log(response.data);

      if (response.data && response.data.id) {
        setInstruction(response.data.instruction);
        setAssessId(response.data.id);
        if (response.data.questions) {
          try {
            const parsedQuestions: Question[] = JSON.parse(
              response.data.questions,
            );
            setQuestions(parsedQuestions);
            setAssessmentExist(true);
          } catch (parseError) {
            console.error('Error parsing questions:', parseError);
            setError('Gagal memproses data pertanyaan.');
          }
        } else {
          setQuestions([]);
          setAssessmentExist(true);
        }
      } else {
        setAssessmentExist(false);
      }
    } catch (err) {
      console.error('Error fetching assessment:', err);
      setError('Gagal memuat assessment. Silakan coba lagi.');
      setAssessmentExist(false); // Set assessmentExist ke false jika error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
    fetchData();
  }, [id]);

  const handleAddOption = () => {
    if (newOptionText.trim() !== '') {
      setCurrentOptions([...currentOptions, newOptionText]);
      setNewOptionText('');
    }
  };

  const handleSaveQuestion = async () => {
    const newQuestion: Question = {
      question: newQuestionText,
      options: questionType === 'MC' ? currentOptions : undefined,
      answer: newAnswerText,
      type: questionType as 'MC' | 'EY',
    };
    try {
      await api.put(`/assessment/${assessId}`, {
        questions: JSON.stringify([...questions, newQuestion]),
      });

      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Question added successfully',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchData();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add question',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Error while updating questions: ', err);
    }

    setNewQuestionText('');
    setCurrentOptions([]);
    setNewAnswerText('');
  };

  const handleDeleteQuestion = async (index: number) => {
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
          const updatedQuestions = questions.filter((_, i) => i !== index);
          await api.put(`/assessment/${assessId}`, {
            questions: JSON.stringify(updatedQuestions),
          });
          setQuestions(updatedQuestions);
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Question deleted successfully',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
          fetchData();
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete question',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
          console.error('Error deleting question:', error);
          setError('Gagal menghapus pertanyaan. Silakan coba lagi.');
        }
      }
    });
  };

  const handleCreateAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/assessment', {
        // Perubahan URL
        chapterId: Number(id), // Pastikan id diubah ke integer
        instruction: instruction,
        questions: JSON.stringify(questions),
      });
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Assessment added successfully',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchData();
    } catch (createError) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add assessment',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Error creating assessment:', createError);
      setError('Gagal membuat assessment. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setEditInstruction(instruction);
    setIsModalOpen(true);
  };

  const handleClearForm = () => {
    setEditInstruction('');
    setIsModalOpen(false);
  };

  const handleEditInstruction = async () => {
    try {
      await api.put(`/assessment/${assessId}`, {
        instruction:
          editInstruction.trim() !== '' ? editInstruction : undefined,
      });
      handleClearForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Instruction updated successfully',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchData();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update instruction',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Failed to edit instruction', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <style>{selectStyle}</style>
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
        &gt; Assessment
      </div>
      <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
        <h1 className="text-2xl font-bold pb-5">Assessment Management</h1>
        <hr />
        {assessmentExist ? (
          <div className="mt-4">
            {/* logic user response  */}
            <div className="p-4 border">
              <div className="flex justify-between">
                <strong className="grid content-center">User Response</strong>
                <button
                  onClick={() =>
                    navigate(`/course/${courseId}/assessment/${id}/response`)
                  }
                  className="px-4 py-2 bg-success hover:bg-opacity-90 text-white rounded-md"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 192 512"
                    width="20"
                    height="20"
                    fill="white"
                  >
                    <path d="M48 80a48 48 0 1 1 96 0A48 48 0 1 1 48 80zM0 224c0-17.7 14.3-32 32-32l64 0c17.7 0 32 14.3 32 32l0 224 32 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 512c-17.7 0-32-14.3-32-32s14.3-32 32-32l32 0 0-192-32 0c-17.7 0-32-14.3-32-32z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 border mt-4">
              <div className="flex justify-between">
                <strong className="grid content-center">Instruction</strong>
                <button
                  onClick={() => handleOpenModal()}
                  className="px-4 py-2 bg-warning hover:bg-opacity-90 text-white rounded-md"
                >
                  <svg
                    viewBox="0 0 512 512"
                    width="20"
                    height="20"
                    fill="white"
                  >
                    <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z" />
                  </svg>
                </button>
              </div>
              <hr className="my-2" />
              {instruction}
            </div>

            {questions.length > 0 && (
              <div className="border p-4 mt-4 flex flex-col gap-4">
                {questions.map((q, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-10 bg-slate-100"
                  >
                    <div className="flex justify-between mb-2">
                      <strong className="grid content-center">
                        QUESTION {index + 1}
                      </strong>

                      {/* button edit */}
                      <div className="flex gap-2">
                        <button
                          className="bg-warning hover:bg-opacity-90 px-4 py-2 rounded-md"
                          onClick={() =>
                            navigate(
                              `/course/${courseId}/assessment/${id}/edit-question/${index}`,
                            )
                          }
                        >
                          <svg
                            viewBox="0 0 512 512"
                            width="20"
                            height="20"
                            fill="white"
                          >
                            <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z" />
                          </svg>
                        </button>

                        {/* button hapus */}
                        <button
                          onClick={() => handleDeleteQuestion(index)}
                          className="bg-danger hover:bg-opacity-90 px-4 py-2 rounded-md"
                        >
                          <svg
                            viewBox="0 0 512 512"
                            width="20"
                            height="20"
                            fill="white"
                          >
                            <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0L284.2 0c12.1 0 23.2 6.8 28.6 17.7L320 32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 7.2-14.3zM32 128l384 0 0 320c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-320zm96 64c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p>{q.question}</p>
                    <p className="mt-2">
                      <strong>TYPE</strong> <br />
                      {q.type === 'MC' ? 'Multiple Choice' : 'Essay'}
                    </p>
                    {q.type === 'MC' &&
                      q.options &&
                      Array.isArray(q.options) &&
                      q.options.length > 0 && (
                        <div className="mt-2">
                          <p>
                            <strong>OPTION</strong>
                          </p>
                          {q.options.map((option, optionIndex) => (
                            <div key={optionIndex}>{optionList.charAt(optionIndex)}. {option}</div>
                          ))}
                          <p className="mt-2">
                            <strong>ANSWER</strong>
                            <br /> {q.answer}
                          </p>
                        </div>
                      )}
                    {q.type === 'EY' && (
                      <p className="mt-2">
                        <strong>ANSWER</strong>
                        <br /> {q.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4">
              <p className="font-semibold mb-2">Make Question</p>
              <div className="border p-4">
                <div className="mb-4">
                  <div className="mb-2">Type</div>
                  <select
                    className="relative z-20 w-full appearance-none rounded-lg border border-stroke bg-transparent py-3 px-5 pr-10 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input custom-select"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                  >
                    <option value="MC">Multiple Choice</option>
                    <option value="EY">Essay</option>
                  </select>
                </div>

                <div className="mb-4">
                  <div className="mb-2">Question</div>
                  <input
                    type="text"
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="Question...?"
                  />
                </div>
                {questionType === 'MC' ? (
                  <div>
                    <div className="mb-4">
                      <div className="mb-2">Option</div>
                      <input
                        type="text"
                        className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                        placeholder='Input Option'
                        value={newOptionText}
                        onChange={(e) => setNewOptionText(e.target.value)}
                      />
                    </div>
                    <div className="mb-4">
                      <button
                        className="py-2 px-4 bg-slate-400 hover:bg-opacity-90 font-medium text-white rounded-md"
                        onClick={handleAddOption}
                      >
                        Save Option
                      </button>
                    </div>
                    <div className="">
                      {currentOptions.map((option, index) => (
                        <div
                          className={
                            index === currentOptions.length - 1 ? 'mb-4' : ''
                          }
                          key={index}
                        >
                          {optionList.charAt(index)}. {option}
                        </div>
                      ))}
                    </div>
                    <div className="mb-4">
                      <div className="mb-2">Answer</div>
                      <select
                        className="relative z-20 w-full appearance-none rounded-lg border border-stroke bg-transparent py-3 px-5 pr-10 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input custom-select"
                        value={newAnswerText}
                        onChange={(e) => setNewAnswerText(e.target.value)}
                      >
                        <option value="">Choose Answer</option>
                        {currentOptions.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                     <div className="mb-2">Answer</div>
                    <input
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                      type="text"
                      placeholder='Input Answer'
                      value={newAnswerText}
                      onChange={(e) => setNewAnswerText(e.target.value)}
                    />
                  </div>
                )}
                <button
                  className="py-2 px-4 bg-primary hover:bg-opacity-90 font-medium text-white rounded-md"
                  onClick={handleSaveQuestion}
                >
                  Save Question
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block font-semibold mb-2 mt-4">Instruksi</label>
            <input
              type="text"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
            />
            <button
              className="bg-primary mt-4 hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded"
              onClick={handleCreateAssessment}
            >
              Create Assessment
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-9999">
          <div
            className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            style={{ width: '800px', maxWidth: '90%' }}
          >
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Edit Instruction
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <div>
                <div className="mb-4">
                  <label
                    htmlFor="instruction"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Instruction
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    placeholder="Input Instruction"
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleClearForm}
                    className="bg-gray-400 hover:bg-opacity-90 text-gray-800 font-medium py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditInstruction().then()}
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

export default Assessment;
