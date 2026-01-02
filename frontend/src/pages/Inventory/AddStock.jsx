import React from 'react';
import { useNavigate } from 'react-router-dom';
import StockForm from './StockForm';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

const AddStock = () => {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate('/inventory');
    };

    const handleCancel = () => {
        navigate('/inventory');
    };

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Stock Item</CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto">
                    <StockForm onSuccess={handleSuccess} onCancel={handleCancel} />
                </CardContent>
            </Card>
        </div>
    );
};

export default AddStock;
