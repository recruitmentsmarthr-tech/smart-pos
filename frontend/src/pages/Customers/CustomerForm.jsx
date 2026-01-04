import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Loader2 } from 'lucide-react';

const CustomerForm = ({ onSubmit, initialData, isEditing = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    remark: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      navigate('/customers');
    } catch (error) {
      console.error("Failed to submit customer form:", error);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Customer' : 'Create Customer'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
            <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" />
            <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" />
            <Textarea name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
            <Textarea name="remark" value={formData.remark} onChange={handleChange} placeholder="Remark" />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/customers')}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerForm;
