import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/api';
import { AddMaterialDto, MaterialDto } from '../dto/MaterialDto';
import FroalaEditor from 'react-froala-wysiwyg';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/js/plugins/image.min.js';
import 'froala-editor/js/plugins/lists.min.js';
import 'froala-editor/js/plugins/table.min.js';
import 'froala-editor/js/plugins/video.min.js';
import 'froala-editor/js/plugins/link.min.js';
import 'froala-editor/js/plugins/font_size.min.js';
import 'froala-editor/js/plugins/code_beautifier.min.js';
import 'froala-editor/js/plugins/code_view.min.js';
import { CourseDto } from '../dto/CourseDto';
import Swal from 'sweetalert2';

const Material: React.FC = () => {
  const { courseId, id } = useParams();
  const [dataCourse, setDataCourse] = useState<CourseDto>();
  const [materialData, setMaterialData] = useState<{
    material: MaterialDto;
    froalaContent: string;
  }>({
    material: {} as MaterialDto,
    froalaContent: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [materialExists, setMaterialExists] = useState(false);
  const [froalaLoading, setFroalaLoading] = useState(true);
  const [froalaRender, setFroalaRender] = useState(false);

  const fetchCourse = async () => {
    const responseCourse = await api.get<CourseDto>(`/course/${courseId}`);
    console.log(responseCourse.data);

    if (responseCourse.data?.id) {
      setDataCourse(responseCourse.data);
    }
  };

  const fetchData = useCallback(async () => {
    if (!id) {
      console.error('ID is null or undefined');
      return;
    }
    try {
      const response = await api.get<MaterialDto>(`/chapter/${id}/materials`);
      if (response.data?.id) {
        setMaterialData({
          material: response.data,
          froalaContent: response.data.content,
        });
        setMaterialExists(true);
        setFroalaLoading(false); // Data loaded, Froala can render
      } else {
        setMaterialExists(false);
        setMaterialData({ material: {} as MaterialDto, froalaContent: '' });
        setFroalaLoading(false); // No data, Froala should not render
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMaterialExists(false);
      // setFroalaLoading(true); // Error occured, Froala should not render
    } finally {
      // setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchCourse();
      fetchData();
    }
  }, [id, fetchData]);

  useEffect(() => {
    if (!froalaLoading) {
      const timer = setTimeout(() => {
        setFroalaRender(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setFroalaRender(false);
    }
  }, [froalaLoading]);

  const handleFroalaChange = useCallback((model: string) => {
    setMaterialData((prev) => ({ ...prev, froalaContent: model }));
  }, []);

  const saveMaterial = useCallback(async () => {
    try {
      const materialToSave: AddMaterialDto = {
        chapterId: parseInt(id ?? '0', 10),
        name: materialData.material.name,
        content: materialData.froalaContent,
      };

      materialExists
        ? await api.put(`/material/${materialData.material.id}`, materialToSave)
        : await api.post('/material', materialToSave);

      materialExists
        ? Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Material updated successfully',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          })
        : Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Material added successfully',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });

      fetchData();
      setIsEditing(false);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add material',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      console.error('Error saving material:', error);
    }
  }, [id, materialData, materialExists, fetchData]);

  return (
    <div>
      <div className="pb-6 text-xl font-semibold">
        <Link to="/course" className="text-blue-500 hover:text-blue-400">
          Course{' '}
        </Link>
        &gt;
        <Link
          to={`/course/${courseId}`}
          className="text-blue-500 hover:text-blue-400"
        >
          {' '}
          {dataCourse?.name}{' '}
        </Link>
        &gt; Material
      </div>
      <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
        <h1 className="text-2xl font-bold pb-5">Material Management</h1>
        <hr />

        <div className="mt-6">
          {!materialExists && !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full inline-flex items-center font-medium justify-center rounded-md px-3 py-2 bg-primary text-white hover:bg-opacity-90"
            >
              Add Material
            </button>
          ) : (
            <div>
              <label
                htmlFor="name"
                className="mb-3 block text-black dark:text-white"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                value={materialData.material?.name || ''}
                onChange={(e) =>
                  setMaterialData((prev) => ({
                    ...prev,
                    material: { ...prev.material, name: e.target.value },
                  }))
                }
                className="w-full rounded-lg border border-stroke py-3 px-5 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white"
              />
              <label
                htmlFor="content"
                className="mt-4 mb-3 block text-black dark:text-white"
              >
                Content
              </label>
              {froalaLoading ? (
                <div>Loading Editor...</div>
              ) : (
                froalaRender && (
                  <FroalaEditor // Hanya render jika froalaRender true
                    key={materialData.material.id}
                    model={materialData.froalaContent}
                    onModelChange={handleFroalaChange}
                    config={{
                      placeholderText: 'Masukkan teks di sini...',
                      imagePaste: true,
                      imageAllowedTypes: ['jpeg', 'jpg', 'png'],
                      events: {
                        'image.beforeUpload': function (images: File[]) {
                          const editor: any = this;
                          const reader = new FileReader();
                          reader.onload = (e: ProgressEvent<FileReader>) => {
                            if (e.target?.result) {
                              editor.image.insert(
                                e.target.result as string,
                                null,
                                null,
                                null,
                                null,
                                null,
                                editor.image.get(),
                              );
                            }
                          };
                          reader.readAsDataURL(images[0]);
                          return false;
                        },
                      },
                    }}
                    tag="textarea"
                  />
                )
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={saveMaterial}
                  className="rounded-md px-4 py-2 bg-primary text-white font-medium hover:bg-opacity-90"
                >
                  Save
                </button>
                {isEditing && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="rounded-md px-4 py-2 bg-gray-500 text-white font-medium hover:bg-opacity-90"
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

export default Material;
