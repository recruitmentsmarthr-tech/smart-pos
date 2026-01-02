import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import StockForm from './StockForm';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Loader2 } from 'lucide-react';

const EditStock = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { page } = location.state || { page: 1 };
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchItem = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/stock/${id}`);
            setItem(res.data);
        } catch (error) {
            console.error("Failed to fetch stock item", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchItem();
    }, [fetchItem]);

    const handleSuccess = () => {
        navigate(`/inventory?page=${page}`);
    };

    const handleCancel = () => {
        navigate(`/inventory?page=${page}`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!item) {
        return <div className="text-center p-4">Stock item not found.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Stock Item</CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto">
                    <StockForm
                        isEditMode={true}
                        item={item}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default EditStock;
