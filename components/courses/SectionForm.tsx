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
import { Button } from "../ui/button";
import { toast } from "sonner";
import { courseSectionStatues, CourseSectionStatus } from "@/drizzle/schema";
import { sectionSchema } from "@/data/zodSchema/section";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { createSection, mutateSection } from "@/features/actions/section";
import { LoadingTextSwap } from "../ActionButton";
import { useTransition } from "react";

const SectionForm = ({
	section,
	courseId,
	onSuccess,
}: {
	section?: {
		id: string;
		name: string;
		status: CourseSectionStatus;
	};
	courseId: string;
	onSuccess: () => void;
}) => {
	const [isLoading, startTransition] = useTransition();
	const form = useForm<z.infer<typeof sectionSchema>>({
		resolver: zodResolver(sectionSchema),
		defaultValues: section ?? {
			name: "",
			status: "public",
		},
	});

	async function onSubmit(values: z.infer<typeof sectionSchema>) {
		const action =
			section == null
				? createSection.bind(null, courseId)
				: mutateSection.bind(null, section.id);

		startTransition(async () => {
			const { success, message } = await action(values);

			if (success === false) {
				toast.error(message);
			} else {
				toast.success(message);
				onSuccess();
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
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Status</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{courseSectionStatues.map((status) => (
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

export default SectionForm;
