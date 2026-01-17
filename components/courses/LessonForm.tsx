"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
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
import { lessonStatues, lessonStatus } from "@/drizzle/schema";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { lessonSchema } from "@/data/zodSchema/lesson";
import { Textarea } from "../ui/textarea";
import { createLesson, mutateLesson } from "@/features/actions/lesson";
import YoutubeVideoPlayer from "../YoutubeVideoPlayer";

const LessonForm = ({
	sections,
	defaultSectionId,
	lesson,
	onSuccess,
}: {
	sections: {
		id: string;
		name: string;
	}[];
	defaultSectionId?: string;
	lesson?: {
		id: string;
		name: string;
		status: lessonStatus;
		youtubeVideoId: string;
		description: string | null;
		sectionId: string;
	};
	onSuccess: () => void;
}) => {
	const form = useForm<z.infer<typeof lessonSchema>>({
		resolver: zodResolver(lessonSchema),
		defaultValues: {
			name: lesson?.name ?? "",
			status: lesson?.status ?? "public",
			youtubeVideoId: lesson?.youtubeVideoId ?? "",
			description: lesson?.description ?? "",
			sectionId: lesson?.sectionId ?? defaultSectionId ?? sections[0]?.id ?? "",
		},
	});

	async function onSubmit(values: z.infer<typeof lessonSchema>) {
		const action =
			lesson == null ? createLesson : mutateLesson.bind(null, lesson.id);

		const { success, message } = await action(values);

		if (success === false) {
			toast.error(message);
		} else {
			toast.success(message);
			onSuccess();
		}
	}

	const videoId = useWatch({
		// useWatch lets you subscribe to the value of one or more form fields without re-rendering the entire form. (reconciliation)
		control: form.control,
		name: "youtubeVideoId",
	});
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
								<Input {...field} aria-required />
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
							<FormLabel>Description</FormLabel>
							<FormControl>
								<Textarea
									className="min-h-20 resize-none"
									{...field}
									value={field.value ?? ""}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="youtubeVideoId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<RequiredLabelIcon aria-hidden />
								Youtube Video Id
							</FormLabel>
							<FormControl>
								<Input {...field} aria-required />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="sectionId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<RequiredLabelIcon aria-hidden />
								Section
							</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{sections.map((section) => (
										<SelectItem key={section.id} value={section.id}>
											{section.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="status"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								<RequiredLabelIcon aria-hidden />
								Status
							</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{lessonStatues.map((status) => (
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
					aria-disabled={form.formState.isSubmitting}
				>
					Save
				</Button>
				{videoId && <YoutubeVideoPlayer videoId={videoId} />}
			</form>
		</Form>
	);
};

export default LessonForm;
