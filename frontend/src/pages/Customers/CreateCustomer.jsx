import React from 'react';
import CustomerForm from './CustomerForm';
import api from '~/api';

const CreateCustomer = () => {
  const handleCreate = async (customerData) => {
    await api.post('/customers/', customerData);
  };

  return <CustomerForm onSubmit={handleCreate} isEditing={false} />;
};

export default CreateCustomer;
