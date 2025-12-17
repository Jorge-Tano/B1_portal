import LoginForm from '@/components/auth/LoginForm'
import { SessionProvider } from "next-auth/react"   

export default function Home() {
  return (
    <LoginForm></LoginForm>
  );
}
