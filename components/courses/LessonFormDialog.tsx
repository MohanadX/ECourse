"use client";

import { ReactNode, useState } from "react";
import { Dialog, DialogHeader } from "../ui/dialog";
import { DialogContent, DialogTitle } from "../ui/dialog";
import { lessonStatus } from "@/drizzle/schema";
import LessonForm from "./LessonForm";

const LessonFormDialog = ({
	sections,
	defaultSectionId,
	lesson,
	children,
}: {
	sections: { id: string; name: string }[];
	defaultSectionId?: string;
	children: ReactNode;
	lesson?: {
		id: string;
		name: string;
		status: lessonStatus;
		youtubeVideoId: string;
		description: string | null;
		sectionId: string;
	};
}) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{children}
			<DialogContent className="h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{lesson == null ? "New Lesson" : `Edit ${lesson.name}`}
					</DialogTitle>
				</DialogHeader>
				<div className="mt-4">
					<LessonForm
						sections={sections}
						lesson={lesson}
						defaultSectionId={defaultSectionId}
						onSuccess={() => setIsOpen(false)}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default LessonFormDialog;
