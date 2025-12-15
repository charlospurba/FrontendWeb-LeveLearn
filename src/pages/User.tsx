import { useEffect, useState } from 'react';
//@ts-ignore
import { AddUserDto, EditUserDto, UserDto } from '../dto/UserDto';
import api from '../api/api';
import DataTable from 'datatables.net-react';
import DT from 'datatables.net-dt';
import Swal from 'sweetalert2';
import { BadgeDto } from '../dto/BadgeDto';
import { TradeDto } from '../dto/TradeDto';

DataTable.use(DT);

export default function User() {
  const user = JSON.parse(localStorage.getItem('user') || '');
  const [data, setData] = useState<UserDto[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>(
    'STUDENT',
  );
  const [username, setUsername] = useState<string>('');
  const [student_id, setStudent_id] = useState<string>('');
  const [instructor_id, setInstructor_id] = useState<string>('');
  const [userId, setUserId] = useState<number>();
  const [point, setPoint] = useState<number>();
  const [badge, setBadge] = useState<BadgeDto[]>();
  const [trade, setTrade] = useState<TradeDto[]>();

  const style = `
    .swal2-container {
      z-index: 10000;
    }
  `;

  const fetchData = async () => {
    try {
      const response = await api.get<UserDto[]>('/user');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data: ', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isFormValid = () => {
    if (role === 'INSTRUCTOR') {
      if (!name || !username || !instructor_id) {
        Swal.fire({
          icon: 'warning',
          title: 'Warning',
          text: 'Please fill in all required fields (Name, Username, Instructor ID).',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        return false;
      }
    } else if (role === 'STUDENT') {
      if (!name || !username || !student_id) {
        Swal.fire({
          icon: 'warning',
          title: 'Warning',
          text: 'Please fill in all required fields (Name, Username, Student ID).',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        return false;
      }
    } else if (role === 'ADMIN') {
      if (!name || !username) {
        Swal.fire({
          icon: 'warning',
          title: 'Warning',
          text: 'Please fill in all required fields (Name, Username).',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        return false;
      }
    }

    return true;
  };

  const handleAddUser = async () => {
    if (!isFormValid()) {
      return;
    }

    const uploadData: AddUserDto = {
      name: name,
      username: username,
      password: 'password',
      role: role,
      instructor_id: instructor_id,
      student_id: student_id,
    };

    try {
      const response = await api.post<AddUserDto>('/user', uploadData);
      console.log(response.data);

      handleClearForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'User added successfully.',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchData();
    } catch (error) {
      console.error('Error while adding user: ', error);
      setIsAddModalOpen(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add user',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  const handleEditModal = (user: UserDto) => {
    setName(user.name);
    setUsername(user.username);
    setRole(user.role);
    setInstructor_id(user.instructorId || '');
    setStudent_id(user.studentId || '');
    setUserId(user.id);

    setIsEditModalOpen(true);
  };

  const handleEditUser = async () => {
    const instructorId = role === 'INSTRUCTOR' ? instructor_id : '';
    const studentId = role === 'STUDENT' ? student_id : '';

    const uploadData: EditUserDto = {
      name: name !== '' ? name : undefined,
      username: username !== '' ? username : undefined,
      role: role,
      instructorId: instructorId !== '' ? instructorId : undefined,
      studentId: studentId !== '' ? studentId : undefined,
    };

    try {
      await api.put<EditUserDto>(`/user/${userId}`, uploadData);
      handleClearForm();
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'User updated successfully.',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      fetchData();
    } catch (error) {
      console.error('Error while updating user: ', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update user',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  const handleDeleteUser = async (id: number) => {
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
          await api.delete(`/user/${id}`);

          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'User delete successfully',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
          });
          fetchData();
        } catch (error) {
          console.error('Error while deleting user: ', error);
        }
      }
    });
  };

  const handleInfoUser = async (user: UserDto) => {
    try {
      const response = await api.get(`/user/${user.id}/badges`);
      const dataBadge = response.data.map((item: any) => item.badge);
      setBadge(dataBadge);
    } catch (error) {
      console.error('Error while getting info user', error);
    }

    try {
      const response = await api.get(`/user/${user.id}/trades`);
      const dataTrade = response.data.map((item: any) => item.trade);
      setTrade(dataTrade);
    } catch (error) {
      console.error('Error while getting info user', error);
    }

    setPoint(user.points || 0);
    setIsInfoModalOpen(true);
  };

  const handleClearForm = () => {
    setName('');
    setRole('STUDENT');
    setUsername('');
    setInstructor_id('');
    setStudent_id('');
    setPoint(undefined);
    setBadge(undefined);
    setTrade(undefined);

    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsInfoModalOpen(false);
  };

  const columns = [
    { data: 'name', title: 'Name' },
    { data: 'username', title: 'Username' },
    { data: 'role', title: 'Role' },
    {
      data: 'studentId',
      title: 'Students ID',
      render: function (data: string | null) {
        return data ? data : '-';
      },
    },
    {
      data: 'instructorId',
      title: 'Instructor ID',
      render: function (data: string | null) {
        return data ? data : '-';
      },
    },
    {
      data: 'createdAt',
      title: 'Created At',
      visible: false,
    },
    // {
    //   data: null,
    //   title: 'Actions',
    //   orderable: false,
    //   searchable: false,
    //   createdCell: (cell: HTMLTableCellElement, _: any, rowData: UserDto) => {
    //     cell.innerHTML = '';

    //     const buttonContainer = document.createElement('div');
    //     buttonContainer.className = 'flex space-x-2';

    //     const createButton = (
    //       buttonColor: string,
    //       svgPath: string,
    //       title: string,
    //       onClick: () => void,
    //     ) => {
    //       const button = document.createElement('button');
    //       button.className = `px-4.5 py-2.5 ${buttonColor} text-white rounded-md`;
    //       button.title = title;

    //       const svg = document.createElementNS(
    //         'http://www.w3.org/2000/svg',
    //         'svg',
    //       );
    //       svg.setAttribute('viewBox', '0 0 512 512');
    //       svg.setAttribute('width', '20');
    //       svg.setAttribute('height', '20');
    //       svg.setAttribute('fill', 'white');
    //       svg.innerHTML = svgPath;

    //       button.appendChild(svg);
    //       button.onclick = onClick;
    //       return button;
    //     };

    //     const editButton = createButton(
    //       'bg-warning',
    //       `<path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"/>`,
    //       'Edit',
    //       () => handleEditModal(rowData),
    //     );

    //     const deleteButton = createButton(
    //       'bg-danger',
    //       `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0L284.2 0c12.1 0 23.2 6.8 28.6 17.7L320 32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 7.2-14.3zM32 128l384 0 0 320c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-320zm96 64c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16z"/></svg>`, // Example SVG for view
    //       'Delete',
    //       () => handleDeleteUser(rowData.id),
    //     );

    //     buttonContainer.appendChild(editButton);
    //     buttonContainer.appendChild(deleteButton);

    //     cell.appendChild(buttonContainer);
    //   },
    // },
    ...(user.role === 'ADMIN'
      ? [
          {
            data: null,
            title: 'Actions',
            orderable: false,
            searchable: false,
            createdCell: (
              cell: HTMLTableCellElement,
              _: any,
              rowData: UserDto,
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

              const editButton = createButton(
                'bg-warning',
                `<path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"/>`,
                'Edit',
                () => handleEditModal(rowData),
              );

              const deleteButton = createButton(
                'bg-danger',
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0L284.2 0c12.1 0 23.2 6.8 28.6 17.7L320 32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 7.2-14.3zM32 128l384 0 0 320c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-320zm96 64c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16l0 224c0 8.8 7.2 16 16 16s16-7.2 16-16l0-224c0-8.8-7.2-16-16-16z"/></svg>`, // Example SVG for view
                'Delete',
                () => handleDeleteUser(rowData.id),
              );

              const infoButton = createButton(
                'bg-success',
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512"><path d="M48 80a48 48 0 1 1 96 0A48 48 0 1 1 48 80zM0 224c0-17.7 14.3-32 32-32l64 0c17.7 0 32 14.3 32 32l0 224 32 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 512c-17.7 0-32-14.3-32-32s14.3-32 32-32l32 0 0-192-32 0c-17.7 0-32-14.3-32-32z"/></svg>`,
                'Info',
                () => handleInfoUser(rowData),
              );

              buttonContainer.appendChild(infoButton);
              buttonContainer.appendChild(editButton);
              buttonContainer.appendChild(deleteButton);

              cell.appendChild(buttonContainer);
            },
          },
        ]
      : user.role === 'INSTRUCTOR'
      ? [
          {
            data: null,
            title: 'Actions',
            orderable: false,
            searchable: false,
            createdCell: (
              cell: HTMLTableCellElement,
              _: any,
              rowData: UserDto,
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
                svg.setAttribute('viewBox', '0 0 192 512');
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
                () => handleInfoUser(rowData),
              );

              buttonContainer.appendChild(infoButton);
              cell.appendChild(buttonContainer);
            },
          },
        ]
      : []),
  ];

  return (
    <div>
      <style>{style}</style>
      <div className="pb-6 text-xl font-semibold">User</div>
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h1 className="text-2xl font-bold pb-5">User Management</h1>
        <hr />
        {user.role === 'ADMIN' && (
          <div className="text-end mt-6">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center rounded-md px-3 py-2 bg-primary text-center font-medium text-white hover:bg-opacity-90"
            >
              Add User
            </button>
          </div>
        )}

        <div className="max-w-full overflow-x-auto ">
          <DataTable
            data={data}
            columns={columns}
            className="display nowrap w-full"
            options={{
              order: [[5, 'desc']], // Urutkan berdasarkan kolom ke-5 (createdAt) secara descending
            }}
          />
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-9999">
          <div
            className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            style={{ width: '800px', maxWidth: '90%' }}
          >
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Add User
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <div>
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
                    htmlFor="username"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Input Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="role"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Role
                  </label>
                  <select
                    name="role"
                    id="role"
                    value={role}
                    className="relative z-20 w-full appearance-none rounded-lg border border-stroke bg-transparent py-3 px-5 pr-10 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                    onChange={(e) =>
                      setRole(
                        e.target.value as 'ADMIN' | 'INSTRUCTOR' | 'STUDENT',
                      )
                    }
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="STUDENT">STUDENT</option>
                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                  </select>
                </div>

                {role === 'STUDENT' && (
                  <div className="mb-4">
                    <label
                      htmlFor="student-id"
                      className="mb-3 block text-black dark:text-white"
                    >
                      Student ID
                    </label>
                    <input
                      type="text"
                      id="student-id"
                      name="studentId"
                      placeholder="Input Student ID"
                      value={student_id}
                      onChange={(e) => setStudent_id(e.target.value)}
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                )}

                {role === 'INSTRUCTOR' && (
                  <div className="mb-4">
                    <label
                      htmlFor="instuctor-id"
                      className="mb-3 block text-black dark:text-white"
                    >
                      Instructor ID
                    </label>
                    <input
                      type="text"
                      id="instructor-id"
                      name="instructorId"
                      placeholder="Input Instructor ID"
                      value={instructor_id}
                      onChange={(e) => setInstructor_id(e.target.value)}
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => handleClearForm()}
                    className="bg-gray-400 hover:bg-opacity-90 text-gray-800 font-medium py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleAddUser().then();
                    }}
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

      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-9999">
          <div
            className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            style={{ width: '800px', maxWidth: '90%' }}
          >
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Edit User
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <div>
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
                    htmlFor="username"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Input Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="role"
                    className="mb-3 block text-black dark:text-white"
                  >
                    Role
                  </label>
                  <select
                    name="role"
                    id="role"
                    value={role}
                    className="relative z-20 w-full appearance-none rounded-lg border border-stroke bg-transparent py-3 px-5 pr-10 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input"
                    onChange={(e) =>
                      setRole(
                        e.target.value as 'ADMIN' | 'INSTRUCTOR' | 'STUDENT',
                      )
                    }
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="STUDENT">STUDENT</option>
                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                  </select>
                </div>

                {role === 'STUDENT' && (
                  <div className="mb-4">
                    <label
                      htmlFor="student-id"
                      className="mb-3 block text-black dark:text-white"
                    >
                      Student ID
                    </label>
                    <input
                      type="text"
                      id="student-id"
                      name="studentId"
                      placeholder="Input Student ID"
                      value={student_id}
                      onChange={(e) => setStudent_id(e.target.value)}
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                )}

                {role === 'INSTRUCTOR' && (
                  <div className="mb-4">
                    <label
                      htmlFor="instuctor-id"
                      className="mb-3 block text-black dark:text-white"
                    >
                      Instructor ID
                    </label>
                    <input
                      type="text"
                      id="instructor-id"
                      name="instructorId"
                      placeholder="Input Instructor ID"
                      value={instructor_id}
                      onChange={(e) => setInstructor_id(e.target.value)}
                      className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                    />
                  </div>
                )}

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => handleClearForm()}
                    className="bg-gray-400 hover:bg-opacity-90 text-gray-800 font-medium py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleEditUser().then();
                    }}
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

      {isInfoModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75 z-9999">
          <div
            className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"
            style={{ width: '800px', maxWidth: '90%' }}
          >
            <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Info User
              </h3>
            </div>
            <div className="flex flex-col gap-5.5 p-6.5">
              <div>
                <div className="mb-4">
                  <div>Point</div>
                  <div className="mt-2 font-semibold">{point} points</div>
                </div>

                <div className="mb-4">
                  <div>Badge</div>
                  <div className="mt-2 font-semibold">
                    {badge && badge.length > 0 ? (
                      badge.map((item, index) => (
                        <span>
                          {item.name}
                          {index !== badge.length - 1 ? ', ' : ''}
                        </span>
                      ))
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div>Trade</div>
                  <div className="mt-2 font-semibold">
                    {trade && trade.length > 0 ? (
                      trade.map((item, index) => (
                        <span>
                          {item.title}
                          {index !== trade.length - 1 ? ', ' : ''}
                        </span>
                      ))
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={handleClearForm}
                    className="bg-gray-400 hover:bg-opacity-90 text-gray-800 font-medium py-2 px-4 rounded mr-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
