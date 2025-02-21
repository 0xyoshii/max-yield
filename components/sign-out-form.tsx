import { FormEvent } from 'react';
import { signOut } from '@/app/(auth)/auth';

export function SignOutForm() {
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await signOut();
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Sign Out</button>
    </form>
  );
}
