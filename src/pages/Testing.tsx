import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { MaterialDto } from '../dto/MaterialDto';
import FroalaEditorView from 'react-froala-wysiwyg/FroalaEditorView';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

const Testing = () => {
  const [data, setData] = useState<MaterialDto[]>([]);

  const fetchData = async () => {
    try {
      const response = await api.get<MaterialDto[]>('/material'); // Pastikan API mengembalikan array
      console.log(response.data);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <h1>Material List</h1>
      <ul>
        {data.length > 0 ? (
          data.map((test) => (
            <li key={test.id} className="border-b py-4">
              <h3 className="font-bold text-lg">{test.name}</h3>
              <FroalaEditorView model={test.content} />
              {/* {test.content} */}
            </li>
          ))
        ) : (
          <p>Loading or No Data Available</p>
        )}
      </ul>
    </div>
  );
};

export default Testing;
