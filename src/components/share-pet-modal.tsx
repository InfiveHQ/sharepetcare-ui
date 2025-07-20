"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/auth-context";

type Pet = {
  id: string;
  name: string;
};

type SharePetModalProps = {
  pet: Pet;
  onClose: () => void;
};

export default function SharePetModal({ pet, onClose }: SharePetModalProps) {
  const [partnerEmail, setPartnerEmail] = useState("");
  const [permission, setPermission] = useState<'view_only' | 'view_and_log' | 'full_access'>('view_and_log');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user } = useAuth();

  const handleSharePet = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to share pets' });
      setLoading(false);
      return;
    }

    try {
      // Check if this pet is already shared with this email
      const { data: existingShare, error: checkError } = await supabase
        .from('pet_shares')
        .select('*')
        .eq('pet_id', pet.id)
        .eq('shared_with_email', partnerEmail)
        .single();

      if (existingShare) {
        setMessage({ type: 'error', text: `${pet.name} is already shared with ${partnerEmail}` });
        setLoading(false);
        return;
      }

      // Create the pet sharing relationship using email instead of user ID
      const { error: shareError } = await supabase
        .from('pet_shares')
        .insert([{
          pet_id: pet.id,
          owner_id: user.id,
          shared_with_email: partnerEmail,
          permission: permission
        }]);

      if (shareError) {
        console.error("Error sharing pet:", shareError);
        setMessage({ type: 'error', text: `Error sharing pet: ${shareError.message}` });
      } else {
        // Send email notification (optional)
        try {
          await fetch('/api/send-share-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toEmail: partnerEmail,
              petName: pet.name,
              ownerName: user.email?.split('@')[0] || 'A user',
              permission: permission
            })
          });
        } catch (emailError) {
          console.error('Email notification failed:', emailError);
          // Don't fail the whole operation if email fails
        }

        setMessage({ type: 'success', text: `Successfully shared ${pet.name} with ${partnerEmail}! They will see the pet when they sign up with this email.` });
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      setMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-bold mb-4">Share {pet.name}</h2>
        
        <form onSubmit={handleSharePet} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Person's Email</label>
            <input
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="person@example.com"
              className="w-full border rounded-lg p-3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Access Level</label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as any)}
              className="w-full border rounded-lg p-3"
            >
              <option value="view_only">View Only - Can see pet info and task history</option>
              <option value="view_and_log">View & Log - Can see info and log tasks</option>
              <option value="full_access">Full Access - Can edit pet info and manage tasks</option>
            </select>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? "Sharing..." : "Share Pet"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          <p>This person will be able to:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {permission === 'view_only' && (
              <>
                <li>View {pet.name}'s information</li>
                <li>See task history</li>
                <li>Cannot log tasks or make changes</li>
              </>
            )}
            {permission === 'view_and_log' && (
              <>
                <li>View {pet.name}'s information</li>
                <li>Log tasks for {pet.name}</li>
                <li>See task history</li>
                <li>Cannot edit pet info or manage tasks</li>
              </>
            )}
            {permission === 'full_access' && (
              <>
                <li>View {pet.name}'s information</li>
                <li>Log tasks for {pet.name}</li>
                <li>Edit {pet.name}'s information</li>
                <li>Manage task assignments</li>
                <li>See task history</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 