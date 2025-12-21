import DataTable from 'datatables.net-react';
import { useEffect, useState } from 'react';
import api from '../api/api';
import PlaceholderImg from '../images/placeholder-image.png';
import { supabase } from '../api/supabase';
import { AddTradeDto, TradeDto, UpdateTradeDto } from '../dto/TradeDto';
import Swal from 'sweetalert2';

const Trade: React.FC = () => {
  const [data, setData] = useState<TradeDto[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  
  // Form States
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [badgeType, setBadgeType] = useState<string>('BEGINNER');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [oldImageUrl, setOldImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tradeId, setTradeId] = useState<number>(0);

  const selectStyle = `
    .custom-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M8 10l4 4 4-4'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 30px;
      padding-right: 28px;
    }
    .swal2-container { z-index: 10000; }
  `;

  const fetchData = async () => {
    try {
      const response = await api.get<TradeDto[]>('/trade');
      // Menangani jika data dibungkus dalam properti 'data' oleh backend
      const result = Array.isArray(response.data) ? response.data : (response.data as any).data;
      setData(result || []);
    } catch (err) {
      console.error('Error fetching trade:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const truncateText = (text: string, wordLimit: number): string => {
    if (!text) return '';
    const words = text.split(' ');
    return words.length > wordLimit ? words.slice(0, wordLimit).join(' ') + ' ...' : text;
  };

  const handleClearForm = () => {
    setTitle('');
    setTradeId(0);
    setDescription('');
    setBadgeType('BEGINNER');
    if (imagePreview && !imagePreview.startsWith('http')) {
      URL.revokeObjectURL(imagePreview); // Bersihkan memori preview
    }
    setImageFile(null);
    setImagePreview(null);
    setOldImageUrl(null);
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  const handleEditModal = (trade: TradeDto) => {
    setTradeId(trade.id);
    setTitle(trade.title);
    setDescription(trade.description);
    setBadgeType(trade.requiredBadgeType);
    setOldImageUrl(trade.image);
    setImagePreview(trade.image);
    setIsEditModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const isFormValid = () => {
    if (!title || !description || !badgeType) {
      Swal.fire({ icon: 'warning', title: 'Warning', text: 'Please fill in all fields', timer: 1500, showConfirmButton: false });
      return false;
    }
    return true;
  };

  const handleAddTrade = async () => {
    if (!isFormValid()) return;
    if (!imageFile) {
      Swal.fire('Error', 'Please select an image', 'error');
      return;
    }

    Swal.fire({ title: 'Saving...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    let tempTradeId: number | null = null;

    try {
      // 1. Simpan data awal ke Backend
      const response = await api.post('/trade', { title, description, requiredBadgeType: badgeType, image: 'pending' });
      tempTradeId = response.data?.trade?.id || response.data?.id || response.data?.data?.id;

      if (!tempTradeId) throw new Error("Failed to get trade ID");

      // 2. Upload ke Supabase
      const fileName = `${Date.now()}-${imageFile.name}`;
      const filePath = `trade/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('finalproject').upload(filePath, imageFile);
      if (uploadError) throw uploadError;

      // 3. Ambil Public URL Dinamis
      const { data: urlData } = supabase.storage.from('finalproject').getPublicUrl(filePath);
      const imageUrl = urlData.publicUrl;

      // 4. Update URL ke Backend
      await api.put(`/trade/${tempTradeId}`, { image: imageUrl });

      Swal.fire({ icon: 'success', title: 'Success', text: 'Trade added successfully', timer: 1500, showConfirmButton: false });
      handleClearForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      if (tempTradeId) await api.delete(`/trade/${tempTradeId}`).catch(() => {}); // Rollback
      Swal.fire('Error', err.message || 'Failed to add trade', 'error');
    }
  };

  const handleEditTrade = async () => {
    if (!isFormValid()) return;
    Swal.fire({ title: 'Updating...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    let imageUrl = oldImageUrl;

    try {
      if (imageFile) {
        // Hapus file lama jika ada
        if (oldImageUrl) {
          const oldPath = oldImageUrl.split('/finalproject/')[1];
          if (oldPath) await supabase.storage.from('finalproject').remove([oldPath]);
        }
        // Upload file baru
        const fileName = `${Date.now()}-${imageFile.name}`;
        const filePath = `trade/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('finalproject').upload(filePath, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('finalproject').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const updateData: UpdateTradeDto = { title, description, requiredBadgeType: badgeType, image: imageUrl || undefined };
      await api.put(`/trade/${tradeId}`, updateData);

      Swal.fire({ icon: 'success', title: 'Success', text: 'Trade updated successfully', timer: 1500, showConfirmButton: false });
      handleClearForm();
      fetchData();
    } catch (err: any) {
      Swal.fire('Error', 'Update failed', 'error');
    }
  };

  const handleDeleteTrade = async (id: number, imageUrl?: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        if (imageUrl) {
          const path = imageUrl.split('/finalproject/')[1];
          if (path) await supabase.storage.from('finalproject').remove([path]);
        }
        await api.delete(`/trade/${id}`);
        Swal.fire('Deleted!', 'Trade has been deleted.', 'success');
        fetchData();
      } catch (err) {
        Swal.fire('Error', 'Delete failed', 'error');
      }
    }
  };

  const columns = [
    { data: 'title', title: 'Title' },
    { 
      data: 'description', 
      title: 'Description',
      render: (data: string) => truncateText(data, 10) 
    },
    { data: 'requiredBadgeType', title: 'Badge' },
    { data: 'createdAt', title: 'Created At', visible: false },
    {
      data: null,
      title: 'Actions',
      orderable: false,
      createdCell: (cell: HTMLTableCellElement, _: any, rowData: TradeDto) => {
        cell.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'flex space-x-2';

        const btnEdit = document.createElement('button');
        btnEdit.className = 'p-2 bg-warning rounded text-white';
        btnEdit.innerHTML = 'Edit'; // Anda bisa ganti dengan SVG icon Anda kembali
        btnEdit.onclick = () => handleEditModal(rowData);

        const btnDel = document.createElement('button');
        btnDel.className = 'p-2 bg-danger rounded text-white';
        btnDel.innerHTML = 'Delete';
        btnDel.onclick = () => handleDeleteTrade(rowData.id, rowData.image);

        container.append(btnEdit, btnDel);
        cell.appendChild(container);
      },
    },
  ];

  return (
    <div>
      <div className="pb-6 text-xl font-semibold">Trade</div>
      <div className="rounded-sm border border-stroke bg-white px-5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-6">
        <style>{selectStyle}</style>
        <div className="flex justify-between items-center pb-5">
            <h1 className="text-2xl font-bold">Trade Management</h1>
            <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90">+ Add Trade</button>
        </div>
        <hr />
        
        <div className="max-w-full overflow-x-auto mt-6">
          <DataTable data={data} columns={columns} className="display nowrap w-full" options={{ order: [[3, 'desc']] }} />
        </div>

        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-9999 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-boxdark w-full max-w-2xl rounded-lg shadow-xl">
              <div className="p-6 border-b border-stroke dark:border-strokedark">
                <h3 className="text-xl font-bold text-black dark:text-white">{isAddModalOpen ? 'Add Trade' : 'Edit Trade'}</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block mb-2 font-medium">Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-form-input outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Badge Type</label>
                  <select value={badgeType} onChange={(e) => setBadgeType(e.target.value)} className="custom-select w-full p-3 border rounded-lg dark:bg-form-input outline-none">
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCE">ADVANCE</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Description</label>
                  <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border rounded-lg dark:bg-form-input outline-none" />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Image</label>
                  <input type="file" onChange={handleImageChange} className="w-full mb-3" accept="image/*" />
                  <img src={imagePreview || PlaceholderImg} className="w-full h-64 object-cover rounded-lg border shadow-inner" />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button onClick={handleClearForm} className="px-6 py-2 bg-gray-300 rounded-lg">Cancel</button>
                  <button onClick={isAddModalOpen ? handleAddTrade : handleEditTrade} className="px-6 py-2 bg-primary text-white rounded-lg">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Trade;