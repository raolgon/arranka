import { useState } from 'react';
import { supabase } from '../../supabaseClient';

interface UploadAvatarWidgetProps {
    currentAvatarUrl: string | null;
    userId: string;
    onAvatarUpdate: (newUrl: string) => void;
}

const UploadAvatarWidget = ({ currentAvatarUrl, userId, onAvatarUpdate }: UploadAvatarWidgetProps) => {
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            
            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/${Math.random()}.${fileExt}`;

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setPreviewUrl(previewUrl);

            // Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // Update avatar URL in parent component
            onAvatarUpdate(publicUrl);

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            alert(error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-24">
                    {previewUrl ? (
                        <img 
                            src={previewUrl} 
                            alt="Avatar" 
                            className="rounded-full w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl">U</span>
                    )}
                </div>
            </div>
            
            <div className="form-control w-full">
                <label className="label">
                    <span className="label-text">Upload Avatar</span>
                </label>
                <input
                    type="file"
                    accept="image/*"
                    className="file-input file-input-bordered file-input-accent w-full"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
                {uploading && (
                    <div className="mt-2">
                        <span className="loading loading-spinner loading-sm"></span>
                        <span className="ml-2 text-sm">Uploading...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadAvatarWidget;
