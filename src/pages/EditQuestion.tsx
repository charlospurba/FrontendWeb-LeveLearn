import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { AssessmentDto, Question } from '../dto/AssessmentDto';
import Swal from 'sweetalert2';

const EditQuestion: React.FC = () => {
  const { courseId, id, index } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question>({} as Question);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [newOption, setNewOption] = useState<string>('');

  const selectStyle = `
  .custom-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M8 10l4 4 4-4'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 30px;
    padding-right: 28px;
  }`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<AssessmentDto>(
          `/chapter/${id}/assessments`,
        );
        if (response.data && response.data.questions) {
          const parsedQuestions: Question[] = JSON.parse(
            response.data.questions,
          );
          setAllQuestions(parsedQuestions);
          const currentQuestion = parsedQuestions[Number(index)];
          setQuestion(currentQuestion);
        }
      } catch (err) {
        console.error('Error fetching assessment:', err);
      }
    };
    fetchData();
  }, [id, index]);

  const handleSave = async () => {
    try {
      if (question) {
        const updatedQuestions = [...allQuestions];
        updatedQuestions[Number(index)] = question;
        await api.put(`/assessment/${id}`, {
          chapterId: Number(id),
          questions: JSON.stringify(updatedQuestions),
        });
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Question updated successfully',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        navigate(`/course/${courseId}/assessment/${id}`);
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update question',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Error updating question:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    if (question) {
      setQuestion({ ...question, [e.target.name]: e.target.value });
    }
  };

  const handleAddOption = () => {
    if (question && question.options && newOption.trim() !== '') {
      setQuestion({
        ...question,
        options: [...question.options, newOption],
      });
      setNewOption('');
    }
  };

  const handleRemoveOption = (optionIndex: number) => {
    if (question && question.options) {
      const updatedOptions = question.options.filter(
        (_, index) => index !== optionIndex,
      );
      setQuestion({ ...question, options: updatedOptions });
    }
  };

  const handleEditOption = (optionIndex: number, newOptionValue: string) => {
    if (question && question.options) {
      const updatedOptions = question.options.map((option, index) =>
        index === optionIndex ? newOptionValue : option,
      );
      setQuestion({ ...question, options: updatedOptions });
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
      <style>{selectStyle}</style>
      <h1 className="text-2xl font-bold pb-5">Question Management</h1>
      <hr />
      <div className="p-4 mt-4">
        <div>
          <p className="font-bold mb-1">Question</p>
          <input
            type="text"
            name="question"
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            value={question.question}
            onChange={handleChange}
          />
        </div>
        <div>
          {question.type === 'MC' &&
            question.options &&
            Array.isArray(question.options) && (
              <div>
                <p className="font-bold mt-3">Options</p>
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) =>
                        handleEditOption(optionIndex, e.target.value)
                      }
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 my-2 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                    <button
                      className="py-3.5 px-5 bg-warning text-white rounded-md"
                      onClick={() => handleRemoveOption(optionIndex)}
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
                ))}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="New Option"
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                  <button
                    className="py-3.5 px-5 bg-success text-white rounded-md"
                    onClick={handleAddOption}
                  >
                    <svg
                      viewBox="0 0 512 512"
                      width="20"
                      height="20"
                      fill="white"
                    >
                      <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
        </div>
        <div>
          <p className="font-bold mt-3 mb-1">Answer</p>
          {question.type === 'MC' && question.options && (
            <select
              name="answer"
               className="relative z-20 w-full appearance-none rounded-lg border border-stroke bg-transparent py-3 px-5 pr-10 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input custom-select"
              value={question.answer}
              onChange={handleChange}
            >
              <option value="">Select Answer</option>
              {question.options.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          {question.type === 'EY' && (
            <input
              type="text"
              name="answer"
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
              value={question.answer}
              onChange={handleChange}
            />
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            className="bg-primary hover:bg-opacity-90 font-medium rounded-md py-2 px-4 text-white"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="bg-slate-400 hover:bg-opacity-90 font-medium rounded-md py-2 px-4 text-white"
            onClick={() => navigate(`/course/${courseId}/assessment/${id}`)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuestion;
