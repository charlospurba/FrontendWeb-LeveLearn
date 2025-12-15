import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/api';
import {
  AssignmentDto,
  AddAssignmentDto,
  UpdateAssignmentDto,
} from '../dto/AssignmentDto';
import { supabase } from '../api/supabase';
import { CourseDto } from '../dto/CourseDto';
import Swal from 'sweetalert2';

interface AssignmentProps {}

const Assignment: React.FC<AssignmentProps> = () => {
  const navigate = useNavigate();
  const { courseId, id } = useParams();
  const [dataCourse, setDataCourse] = useState<CourseDto>();
  const [instruction, setInstruction] = useState<string>('');
  const [assignId, setAssignId] = useState<number | undefined>();
  const [fileUrl, setFileUrl] = useState<string>('');
  const [assignmentExist, setAssignmentExist] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fetchCourse = async () => {
    const responseCourse = await api.get<CourseDto>(`/course/${courseId}`);

    if (responseCourse.data?.id) {
      setDataCourse(responseCourse.data);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await api.get<AssignmentDto>(
        `/chapter/${id}/assignments`,
      );
      console.log(response.data);

      if (response.data && response.data.id) {
        setAssignId(response.data.id);
        setInstruction(response.data.instruction);
        setFileUrl(response.data.fileUrl);
        setAssignmentExist(true);
      } else {
        setAssignmentExist(false);
      }
    } catch (error: any) {
      console.error('Error while getting data: ', error);
      setErrorMessage(error.message || 'Failed to fetch assignment data.');
      setAssignmentExist(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchData();
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  const deleteFileFromSupabase = async (fileUrl: string) => {
    if (!fileUrl) return;

    const fileName = fileUrl.split('/').pop();
    if (!fileName) return;

    const filePath = `assignment/${id}/${fileName}`;

    const { error } = await supabase.storage
      .from('finalproject')
      .remove([filePath]);
    if (error) {
      console.error('Error deleting file:', error);
      setErrorMessage('Failed to delete old file.');
    }
  };

  const handleSaveAssignment = async () => {
    setIsLoading(true);
    setErrorMessage('');

    if (!instruction.trim()) {
      setErrorMessage('Instruction cannot be empty.');
      setIsLoading(false);
      return;
    }

    let uploadedFileUrl = fileUrl;
    let oldFileUrl = fileUrl; // Simpan URL file lama

    try {
      if (file) {
        const filePath = `assignment/${id}/${encodeURIComponent(file.name)}`;
        const { data, error }: { data: any; error: any } =
          await supabase.storage.from('finalproject').upload(filePath, file, {
            upsert: true,
          });

        if (error) {
          console.error('Error uploading file:', error.message);
          setErrorMessage('Failed to upload file.');
          setIsLoading(false);
          return;
        }

        uploadedFileUrl = `https://msvsocwvhpxfnfhjewar.supabase.co/storage/v1/object/public/finalproject/${filePath}`;

        // Hapus file lama jika ada dan berbeda dengan file baru
        if (oldFileUrl && oldFileUrl !== uploadedFileUrl) {
          await deleteFileFromSupabase(oldFileUrl);
        }
      }

      const chapterId = Number(id);

      if (assignmentExist && assignId) {
        const payload: UpdateAssignmentDto = {
          chapterId: chapterId,
          instruction: instruction,
          fileUrl: uploadedFileUrl,
        };
        await api.put(`/assignment/${assignId}`, payload);
      } else {
        const payload: AddAssignmentDto = {
          chapterId: chapterId,
          instruction: instruction,
          fileUrl: uploadedFileUrl,
        };
        await api.post(`/assignment`, payload);
      }

      assignmentExist && assignId
        ? Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Assignment updated successfully',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          })
        : Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Assignment added successfully',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });

      setIsEditing(false);
      fetchData();
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add assignment',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Error saving assignment:', error);
      setErrorMessage(error.message || 'Failed to save assignment.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAssignmentClick = () => {
    setInstruction('');
    setFileUrl('');
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setErrorMessage('');
  };

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
        &gt; Assignment
      </div>
      <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
        <h1 className="text-2xl font-bold pb-5">Assignment Management</h1>
        <hr />
        {assignmentExist ? (
          <div className="mt-4 p-4 border">
            <div className="flex justify-between">
              <strong className="grid content-center">User Response</strong>
              <button
                onClick={() =>
                  navigate(
                    `/course/${courseId}/assignment/${assignId}/response`,
                  )
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
        ) : (
          <div></div>
        )}

        {isLoading && <p>Loading...</p>}
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}

        <div className="mt-6">
          {!assignmentExist && !isEditing ? (
            <button
              onClick={handleAddAssignmentClick}
              className="w-full inline-flex items-center justify-center rounded-md px-4 py-2 bg-primary text-center font-medium text-white hover:bg-opacity-90"
            >
              Add Assignment
            </button>
          ) : (
            <div className="border p-4">
              <div>
                <label
                  htmlFor="instruction"
                  className="mb-3 block text-black dark:text-white"
                >
                  Instruction
                </label>
                <textarea
                  className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  rows={4}
                  name="instruction"
                  id="instruction"
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                ></textarea>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="file"
                  className="mb-3 block text-black dark:text-white"
                >
                  Upload File
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="w-full rounded-md border border-stroke p-3 outline-none transition file:mr-4 file:rounded file:border-[0.5px] file:border-stroke file:bg-[#EEEEEE] file:py-1 file:px-2.5 file:text-sm focus:border-primary file:focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:file:border-strokedark dark:file:bg-white/30 dark:file:text-white"
                />
              </div>
              {fileUrl && (
                <div className="mt-4">
                  <a
                    className="text-boxdark-2 hover:text-primary"
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View uploaded file
                  </a>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleSaveAssignment}
                  className="rounded-md px-4 py-2 bg-primary text-center font-medium text-white hover:bg-opacity-90"
                >
                  Save
                </button>
                {isEditing && (
                  <button
                    onClick={handleCancelClick}
                    className="rounded-md px-4 py-2 bg-gray-400 text-center font-medium text-white hover:bg-opacity-90"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Assignment;
