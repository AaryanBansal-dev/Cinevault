"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Film,
	Mail,
	Lock,
	User,
	Eye,
	EyeOff,
	ArrowRight,
	Loader2,
	Github,
	Chrome,
} from "lucide-react";

export default function LoginPage() {
	const router = useRouter();
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [showPassword, setShowPassword] = useState(false);
	const { data: session, isPending } = authClient.useSession();

	// Redirect if already logged in
	useEffect(() => {
		if (session?.user && !isPending) {
			router.push("/dashboard");
		}
	}, [session?.user, isPending, router]);



	const signInForm = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
						toast.success("Welcome back!");
					},
					onError: (error) => {
						toast.error(error.error.message || "Sign in failed");
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	const signUpForm = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
						toast.success("Account created successfully!");
					},
					onError: (error) => {
						toast.error(error.error.message || "Sign up failed");
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, "Name must be at least 2 characters"),
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	});

	if (session?.user && !isPending) {
		return null;
	}

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex bg-background">
			{/* Left Side - Branding */}
			<div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
				{/* Background Image */}
				<div
					className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
					style={{
						backgroundImage:
							"url(https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=80)",
					}}
				/>
				{/* Overlay */}
				<div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-background/80 to-background/90 mix-blend-multiply" />
				<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

				{/* Content */}
				<div className="relative z-10 flex flex-col justify-between p-12 h-full">
					<Link href="/" className="flex items-center gap-3 w-fit group">
						<div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300 shadow-lg group-hover:shadow-primary/20">
							<Film className="w-6 h-6 text-white" />
						</div>
						<span className="text-2xl font-bold text-white tracking-tight">CineVault</span>
					</Link>

					<div className="space-y-8 max-w-lg">
						<h1 className="text-5xl font-bold text-white leading-tight tracking-tight">
							Your premium
							<br />
							<span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
								streaming experience
							</span>
							<br />
							awaits.
						</h1>
						<p className="text-lg text-white/80 leading-relaxed font-light">
							Join millions of creators and viewers on the open-source video
							platform that puts you in control.
						</p>

						{/* Features */}
						<div className="flex flex-wrap gap-3 pt-4">
							{["4K Streaming", "Zero Fees", "Self-Hosted", "Privacy First"].map((feature) => (
								<div
									key={feature}
									className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors cursor-default"
								>
									{feature}
								</div>
							))}
						</div>
					</div>

					<p className="text-white/40 text-sm font-medium">
						© 2024 CineVault. Open source under MIT License.
					</p>
				</div>
			</div>

			{/* Right Side - Form */}
			<div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
				{/* Background Pattern for Light Mode */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
				
				<div className="w-full max-w-[420px] space-y-8 relative z-10">
					{/* Mobile Logo */}
					<div className="lg:hidden text-center mb-8">
						<Link href="/" className="inline-flex items-center gap-2">
							<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
								<Film className="w-5 h-5 text-white" />
							</div>
							<span className="text-xl font-bold gradient-text">CineVault</span>
						</Link>
					</div>

					<div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/5">
						{/* Header */}
						<div className="text-center mb-8">
							<h2 className="text-2xl font-bold mb-2 tracking-tight">
								{mode === "signin" ? "Welcome back" : "Create account"}
							</h2>
							<p className="text-muted-foreground text-sm">
								{mode === "signin"
									? "Enter your credentials to access your account"
									: "Enter your details to get started for free"}
							</p>
						</div>

						{/* OAuth Buttons */}
						<div className="grid grid-cols-2 gap-3 mb-6">
							<Button variant="outline" className="w-full h-11 bg-background/50 hover:bg-background hover:border-primary/30 transition-all duration-300">
								<Chrome className="w-4 h-4 mr-2" />
								Google
							</Button>
							<Button variant="outline" className="w-full h-11 bg-background/50 hover:bg-background hover:border-primary/30 transition-all duration-300">
								<Github className="w-4 h-4 mr-2" />
								GitHub
							</Button>
						</div>

						{/* Divider */}
						<div className="relative mb-6">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-border" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="px-3 bg-card text-muted-foreground font-medium tracking-wider">
									Or continue with
								</span>
							</div>
						</div>

						{/* Sign In Form */}
						{mode === "signin" && (
							<form
								onSubmit={(e) => {
									e.preventDefault();
									e.stopPropagation();
									signInForm.handleSubmit();
								}}
								className="space-y-5"
							>
								<signInForm.Field name="email">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name} className="text-xs font-semibold uppercase text-muted-foreground ml-1">Email</Label>
											<div className="relative group">
												<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
												<Input
													id={field.name}
													type="email"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="name@example.com"
													className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
												/>
											</div>
											{field.state.meta.errors.map((error) => (
												<p key={error?.message} className="text-xs text-destructive font-medium ml-1">
													{error?.message}
												</p>
											))}
										</div>
									)}
								</signInForm.Field>

								<signInForm.Field name="password">
									{(field) => (
										<div className="space-y-2">
											<div className="flex items-center justify-between ml-1">
												<Label htmlFor={field.name} className="text-xs font-semibold uppercase text-muted-foreground">Password</Label>
												<span className="text-xs text-primary hover:text-primary/80 cursor-pointer font-medium transition-colors">
													Forgot password?
												</span>
											</div>
											<div className="relative group">
												<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
												<Input
													id={field.name}
													type={showPassword ? "text" : "password"}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="••••••••"
													className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
												/>
												<button
													type="button"
													onClick={() => setShowPassword(!showPassword)}
													className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
												>
													{showPassword ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
											{field.state.meta.errors.map((error) => (
												<p key={error?.message} className="text-xs text-destructive font-medium ml-1">
													{error?.message}
												</p>
											))}
										</div>
									)}
								</signInForm.Field>

								<signInForm.Subscribe>
									{(state) => (
										<Button
											type="submit"
											size="lg"
											className="w-full h-11 btn-shine text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
											disabled={!state.canSubmit || state.isSubmitting}
										>
											{state.isSubmitting ? (
												<>
													<Loader2 className="w-5 h-5 mr-2 animate-spin" />
													Signing in...
												</>
											) : (
												<>
													Sign In
													<ArrowRight className="w-5 h-5 ml-2" />
												</>
											)}
										</Button>
									)}
								</signInForm.Subscribe>
							</form>
						)}

						{/* Sign Up Form */}
						{mode === "signup" && (
							<form
								onSubmit={(e) => {
									e.preventDefault();
									e.stopPropagation();
									signUpForm.handleSubmit();
								}}
								className="space-y-5"
							>
								<signUpForm.Field name="name">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name} className="text-xs font-semibold uppercase text-muted-foreground ml-1">Full Name</Label>
											<div className="relative group">
												<User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
												<Input
													id={field.name}
													type="text"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="John Doe"
													className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
												/>
											</div>
											{field.state.meta.errors.map((error) => (
												<p key={error?.message} className="text-xs text-destructive font-medium ml-1">
													{error?.message}
												</p>
											))}
										</div>
									)}
								</signUpForm.Field>

								<signUpForm.Field name="email">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name} className="text-xs font-semibold uppercase text-muted-foreground ml-1">Email</Label>
											<div className="relative group">
												<Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
												<Input
													id={field.name}
													type="email"
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="name@example.com"
													className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
												/>
											</div>
											{field.state.meta.errors.map((error) => (
												<p key={error?.message} className="text-xs text-destructive font-medium ml-1">
													{error?.message}
												</p>
											))}
										</div>
									)}
								</signUpForm.Field>

								<signUpForm.Field name="password">
									{(field) => (
										<div className="space-y-2">
											<Label htmlFor={field.name} className="text-xs font-semibold uppercase text-muted-foreground ml-1">Password</Label>
											<div className="relative group">
												<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
												<Input
													id={field.name}
													type={showPassword ? "text" : "password"}
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder="••••••••"
													className="pl-10 pr-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all"
												/>
												<button
													type="button"
													onClick={() => setShowPassword(!showPassword)}
													className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
												>
													{showPassword ? (
														<EyeOff className="w-4 h-4" />
													) : (
														<Eye className="w-4 h-4" />
													)}
												</button>
											</div>
											<p className="text-xs text-muted-foreground ml-1">
												Must be at least 8 characters
											</p>
											{field.state.meta.errors.map((error) => (
												<p key={error?.message} className="text-xs text-destructive font-medium ml-1">
													{error?.message}
												</p>
											))}
										</div>
									)}
								</signUpForm.Field>

								<signUpForm.Subscribe>
									{(state) => (
										<Button
											type="submit"
											size="lg"
											className="w-full h-11 btn-shine text-base font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
											disabled={!state.canSubmit || state.isSubmitting}
										>
											{state.isSubmitting ? (
												<>
													<Loader2 className="w-5 h-5 mr-2 animate-spin" />
													Creating account...
												</>
											) : (
												<>
													Create Account
													<ArrowRight className="w-5 h-5 ml-2" />
												</>
											)}
										</Button>
									)}
								</signUpForm.Subscribe>

								<p className="text-xs text-center text-muted-foreground">
									By creating an account, you agree to our{" "}
									<span className="text-primary cursor-pointer hover:underline font-medium">
										Terms of Service
									</span>{" "}
									and{" "}
									<span className="text-primary cursor-pointer hover:underline font-medium">
										Privacy Policy
									</span>
								</p>
							</form>
						)}

						{/* Toggle Mode */}
						<div className="mt-8 text-center">
							<p className="text-sm text-muted-foreground">
								{mode === "signin" ? (
									<>
										Don't have an account?{" "}
										<button
											onClick={() => setMode("signup")}
											className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
										>
											Sign up
										</button>
									</>
								) : (
									<>
										Already have an account?{" "}
										<button
											onClick={() => setMode("signin")}
											className="text-primary hover:text-primary/80 hover:underline font-semibold transition-colors"
										>
											Sign in
										</button>
									</>
								)}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
