"use client";

import { courseSchema } from "@/data/zodSchema/course";
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
import { createCourse, mutateCourse } from "@/features/actions/course";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LoadingTextSwap } from "../ActionButton";
import { useQueryClient } from "@tanstack/react-query";

const CourseForm = ({
	course,
}: {
	course?: {
		id: string;
		name: string;
		description: string;
	};
}) => {
	const [isLoading, startTransition] = useTransition();
	const router = useRouter();
	const form = useForm<z.infer<typeof courseSchema>>({
		resolver: zodResolver(courseSchema),
		defaultValues: course ?? {
			name: "",
			description: "",
		},
	});

	const queryClient = useQueryClient();
	async function onSubmit(values: z.infer<typeof courseSchema>) {
		const action =
			course == null ? createCourse : mutateCourse.bind(null, course.id);

		startTransition(async () => {
			const { success, message, courseId } = await action(values);

			if (success === false) {
				toast.error(message);
			} else {
				toast.success(message);
				queryClient.refetchQueries({
					// invalidate all courses page client cache
					predicate: (query) =>
						query.queryKey[0] === "coursesP" ||
						query.queryKey[0] === "userCoursesP",
				});
				if (action == createCourse) router.push(`${courseId}/edit`);
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

export default CourseForm;
