import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CustomerForm from './CustomerForm';
import api from '~/api';
import { Loader2 } from 'lucide-react';

const EditCustomer = () => {
  const { id } = useParams();
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await api.get(`/customers/${id}`);
        setInitialData(res.data);
      } catch (error) {
        console.error("Failed to fetch customer data:", error);
      }
    };
    fetchCustomer();
  }, [id]);

  const handleUpdate = async (customerData) => {
    await api.put(`/customers/${id}`, customerData);
  };

  if (!initialData) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" size={32} /></div>;
  }

  return <CustomerForm onSubmit={handleUpdate} initialData={initialData} isEditing={true} />;
};

export default EditCustomer;
