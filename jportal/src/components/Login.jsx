import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoginError } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.20/dist/jsjiit.esm.js";

// Define the form schema
const formSchema = z.object({
  enrollmentNumber: z.string({
    required_error: "Enrollment number is required",
  }),
  password: z.string({
    required_error: "Password is required",
  }),
})

export default function Login({ onLoginSuccess, w }) {
  const [loginStatus, setLoginStatus] = useState({
    isLoading: false,
    error: null,
    credentials: null
  });

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enrollmentNumber: "",
      password: "",
    },
  })

  // Handle side effects in useEffect
  useEffect(() => {
    if (!loginStatus.credentials) return;

    const performLogin = async () => {
      try {
        await w.student_login(
          loginStatus.credentials.enrollmentNumber,
          loginStatus.credentials.password
        );

        // Store credentials in localStorage
        localStorage.setItem("username", loginStatus.credentials.enrollmentNumber);
        localStorage.setItem("password", loginStatus.credentials.password);

        console.log("Login successful");
        setLoginStatus(prev => ({
          ...prev,
          isLoading: false,
          credentials: null,
        }));
        onLoginSuccess();
      } catch (error) {
        if (error instanceof LoginError && error.message.includes("JIIT Web Portal server is temporarily unavailable")) {
          console.error("JIIT Web Portal server is temporarily unavailable")
          setLoginStatus(prev => ({
            ...prev,
            isLoading: false,
            error: "JIIT Web Portal server is temporarily unavailable. Please try again later.",
            credentials: null,
          }));
        } else if (error instanceof LoginError && error.message.includes("Failed to fetch")) {
          setLoginStatus(prev => ({
            ...prev,
            isLoading: false,
            error: "Please check your internet connection. If connected, JIIT Web Portal server is unavailable.",
            credentials: null,
          }));
        } else {
          console.error("Login failed:", error);
          setLoginStatus(prev => ({
            ...prev,
            isLoading: false,
            error: "Login failed. Please check your credentials.",
            credentials: null,
          }));
        }
      }
    };

    setLoginStatus(prev => ({ ...prev, isLoading: true }));
    performLogin();
  }, [loginStatus.credentials, onLoginSuccess, w]);

  // Clean form submission
  function onSubmit(values) {
    setLoginStatus(prev => ({
      ...prev,
      credentials: values,
      error: null
    }));
  }
  return (
    <div className="flex min-h-screen items-center justify-center dark:bg-gray-100 bg-gray-900">
      <div className="w-full max-w-md space-y-6 p-6 dark:bg-white bg-gray-800">
        <div className="space-y-2 text-center dark:text-gray-900 text-white">
          <h1 className="text-2xl font-bold">Login</h1>
          <p>Enter your credentials to sign in</p>
          {loginStatus.error && (
            <p className="text-red-500">{loginStatus.error}</p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="enrollmentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-gray-900 text-white">Enrollment Number</FormLabel>
                  <FormControl>
                    <Input {...field} className="dark:bg-white bg-gray-700 dark:text-gray-900 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="dark:text-gray-900 text-white">Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} className="dark:bg-white bg-gray-700 dark:text-gray-900 text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full dark:bg-gray-900 dark:text-white bg-white text-[#191c20]"
              disabled={loginStatus.isLoading}
            >
              {loginStatus.isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}