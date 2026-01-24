"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import RequiredLabelIcon from "../RequiredLabelIcon";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { productSchema } from "@/data/zodSchema/product";
import { createProduct, mutateProduct } from "@/features/actions/products";
import { productsStatues, ProductStatus } from "@/drizzle/schema";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { MultiSelect } from "../multi-select";
import { useTransition } from "react";
import { LoadingTextSwap } from "../ActionButton";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";

const ProductForm = ({
	product,
	courses,
	userId,
}: {
	product?: {
		id: string;
		name: string;
		description: string;
		priceInDollars: number;
		imageUrl: string;
		status: ProductStatus;
		courseIds: string[];
	};
	courses: {
		id: string;
		name: string;
	}[];
	userId: string;
}) => {
	const [isLoading, startTransition] = useTransition();
	const router = useRouter();
	const form = useForm<z.infer<typeof productSchema>>({
		resolver: zodResolver(productSchema),
		defaultValues: product
			? {
					name: product.name,
					description: product.description,
					courseIds: product.courseIds,
					image: product.imageUrl,
					priceInDollars: product.priceInDollars,
					status: product.status,
				}
			: {
					name: "",
					description: "",
					courseIds: [],
					image: undefined,
					priceInDollars: 0,
					status: "private",
				},
	});

	const queryClient = useQueryClient();
	async function onSubmit(values: z.infer<typeof productSchema>) {
		const action =
			product == null ? createProduct : mutateProduct.bind(null, product.id);

		startTransition(async () => {
			const { success, message } = await action(values);
			if (success === false) {
				toast.error(message);
			} else {
				toast.success(message);
				queryClient.refetchQueries({
					queryKey: ["productsP"],
				});
				if (action == createProduct)
					router.replace(`/admin/${userId}/products`);
			}
		});
	}
	return (
		<Form {...form}>
			{/*Form it is just context provider using FormProvider (it is required for FormField)  */}
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex gap-6 flex-col"
			>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<RequiredLabelIcon aria-hidden />
									Name
								</FormLabel>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="priceInDollars"
						render={({ field }) => (
							<FormItem>
								<FormLabel>
									<RequiredLabelIcon aria-hidden />
									Price
								</FormLabel>
								<FormControl>
									<Input
										type="number"
										{...field}
										step={1}
										min={0}
										onChange={(e) => {
											const value = e.target.valueAsNumber;
											field.onChange(Number.isNaN(value) ? "" : value);
											// when input is empty valueAsNumber will output NaN which will cause React error
										}}
										value={field.value ?? ""}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="image"
						render={({ field }) => (
							<FormItem>
								<FormLabel className={product ? "relative bottom-2" : ""}>
									{product?.imageUrl ? (
										<Image
											src={product.imageUrl}
											alt={product.name}
											width={38}
											height={38}
										/>
									) : (
										<RequiredLabelIcon aria-hidden />
									)}
									Image
								</FormLabel>
								<FormControl className={product ? "-mt-3" : ""}>
									<Input
										type="file"
										onChange={(e) => field.onChange(e.target.files![0])}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="status"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Status</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										{productsStatues.map((status) => (
											<SelectItem key={status} value={status}>
												{status}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
				<FormField
					control={form.control}
					name="courseIds"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<RequiredLabelIcon aria-hidden />
								Included Courses
							</FormLabel>
							<FormControl>
								<MultiSelect
									selectPlaceholder="Select courses"
									searchPlaceholder="Search courses"
									options={courses}
									getLabel={(opt) => opt.name}
									getValue={(opt) => opt.id}
									selectedValues={field.value}
									onSelectedValuesChange={field.onChange}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="description"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<RequiredLabelIcon aria-hidden />
								Description
							</FormLabel>
							<FormControl>
								{/* handle the error tracking and aria attributes like aria-invalid */}
								<Textarea className="min-h-20 resize-none" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					className="self-end cursor-pointer"
					type="submit"
					disabled={form.formState.isSubmitting}
				>
					<LoadingTextSwap isLoading={isLoading}>Save</LoadingTextSwap>
				</Button>
			</form>
		</Form>
	);
};

export default ProductForm;
