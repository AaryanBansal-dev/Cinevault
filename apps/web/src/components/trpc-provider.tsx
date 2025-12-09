"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

function getBaseUrl() {
	if (typeof window !== "undefined") return "";
	return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 5 * 60 * 1000, // 5 minutes
						retry: 1,
						refetchOnWindowFocus: false,
					},
					mutations: {
						onError: (error) => {
							toast.error(error.message || "Something went wrong");
						},
					},
				},
			})
	);

	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: `${getBaseUrl()}/api/trpc`,
					fetch(url, options) {
						return fetch(url, {
							...options,
							credentials: "include",
						});
					},
				}),
			],
		})
	);

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	);
}
