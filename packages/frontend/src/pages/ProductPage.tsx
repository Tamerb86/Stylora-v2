import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { ProductWithContent } from '../types';
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  Trash2,
  Edit,
  Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<ProductWithContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      
      try {
        const response = await api.getProduct(parseInt(id));
        if (response.success && response.data) {
          setProduct(response.data);
        }
      } catch (error) {
        toast.error('Failed to load product');
        navigate('/app');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProduct();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!product) return;
    
    if (!confirm('Are you sure you want to delete this product?')) return;

    setDeleting(true);
    try {
      await api.deleteProduct(product.id);
      toast.success('Product deleted');
      navigate('/app');
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Product not found</h2>
        <button onClick={() => navigate('/app')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/app')}
          className="p-2 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
          <p className="text-gray-500 text-sm">
            Added on {new Date(product.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline btn-sm">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger btn-sm"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Product Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm text-gray-500">Title</label>
            <p className="text-gray-900">{product.title}</p>
          </div>
          
          {product.priceRaw && (
            <div>
              <label className="text-sm text-gray-500">Price</label>
              <p className="text-gray-900">
                {product.priceRaw} {product.currency}
              </p>
            </div>
          )}
          
          {product.sourceUrl && (
            <div>
              <label className="text-sm text-gray-500">Source URL</label>
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                View Source <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
          
          <div>
            <label className="text-sm text-gray-500">Source</label>
            <p className="text-gray-900 capitalize">{product.source}</p>
          </div>
        </div>

        {product.rawDescription && (
          <div className="mt-6">
            <label className="text-sm text-gray-500">Description</label>
            <p className="text-gray-700 mt-1 whitespace-pre-wrap">
              {product.rawDescription}
            </p>
          </div>
        )}
      </div>

      {/* Latest Content */}
      {product.latestContent && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Latest Generated Content</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span>Type: {product.latestContent.type}</span>
              <span>Language: {product.latestContent.language}</span>
              <span>
                Generated: {new Date(product.latestContent.createdAt).toLocaleString()}
              </span>
            </div>
            <pre className="whitespace-pre-wrap text-gray-700 text-sm">
              {product.latestContent.output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
