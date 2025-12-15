import React, { useState } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import { Link } from 'react-router-dom';

interface ChapterData {
  name: string;
  level: string;
  course: string;
  action: string;
}

const Chapter: React.FC = () => {
  const columns: TableColumn<ChapterData>[] = [
    {
      name: 'Name',
      selector: (row: ChapterData) => row.name,
    },
    {
      name: 'Level',
      selector: (row: ChapterData) => row.level,
    },
    {
      name: 'Course',
      selector: (row: ChapterData) => row.course,
    },
    {
      name: 'Action',
      selector: (row: ChapterData) => row.action,
      cell: (row: ChapterData) => (
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Edit
        </button>
      ),
    },
  ];

  const data: ChapterData[] = [
    {
      name: 'Pengantar IMK',
      level: '1',
      course: 'IMK',
      action: 'edit',
    },
    {
      name: 'IMK Materi 1',
      level: '2',
      course: 'IMK',
      action: 'edit',
    },
    {
      name: 'IMK Materi 2',
      level: '3',
      course: 'IMK',
      action: 'edit',
    },
    // Add more courses as needed
  ];

  const [records, setRecords] = useState<ChapterData[]>(data);

  function handleFilter(event: React.ChangeEvent<HTMLInputElement>) {
    const newData = data.filter((row) => {
      return (
        row.name.toLowerCase().includes(event.target.value.toLowerCase()) || // Filter by course name
        row.level.toLowerCase().includes(event.target.value.toLowerCase()) // Or filter by course ID
      );
    });
    setRecords(newData);
  }

  return (
    <div>
      <div className="flex justify-between mb-2">
        <h1 className="text-2xl text-primary font-bold">
          Chapter Management
        </h1>
        <Link
          to="#"
          className="inline-flex items-center justify-center rounded-md px-3 py-2 bg-primary text-center font-medium text-white hover:bg-opacity-90"
        >
          Add Chapter
        </Link>
      </div>
      <div className="text-end mb-4">
        <input
          type="text"
          placeholder="Search..."
          onChange={handleFilter}
          className="border p-2 rounded"
        />
      </div>
      <DataTable
        columns={columns}
        data={records}
        pagination
        highlightOnHover
        responsive
      />
    </div>
  );
};

export default Chapter;
