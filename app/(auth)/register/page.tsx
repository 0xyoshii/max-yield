'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AuthForm } from '@/components/auth-form';
import { SubmitButton } from '@/components/submit-button';

import { register, type RegisterActionState } from '../actions';

const initialState: RegisterActionState = {
  status: 'idle',
};

export default function Page() {
  const router = useRouter();
  const { pending } = useFormStatus();

  const [email, setEmail] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useFormState<RegisterActionState, FormData>(
    register,
    initialState
  );

  useEffect(() => {
    if (state.status === 'failed') {
      toast.error('Registration failed!');
    } else if (state.status === 'invalid_data') {
      toast.error('Failed validating your submission!');
    } else if (state.status === 'user_exists') {
      toast.error('User already exists!');
    } else if (state.status === 'success') {
      setIsSuccessful(true);
      router.refresh();
    }
  }, [state.status, router]);

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account to get started
          </p>
        </div>
        <AuthForm action={formAction} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign up</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {'Already have an account? '}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {' instead.'}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
