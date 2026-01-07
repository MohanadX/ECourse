"use client";

import { CourseSectionStatus } from "@/drizzle/schema";
import { ReactNode, useState } from "react";
import { Dialog, DialogHeader } from "../ui/dialog";
import { DialogContent, DialogTitle } from "../ui/dialog";
import SectionForm from "./SectionForm";

const SectionFormDialog = ({
	courseId,
	section,
	children,
}: {
	courseId: string;
	section?: { id: string; name: string; status: CourseSectionStatus };
	children: ReactNode;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{children}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{section == null ? "New Section" : `Edit ${section.name}`}
					</DialogTitle>
				</DialogHeader>
				<div className="mt-4">
					<SectionForm
						section={section}
						courseId={courseId}
						onSuccess={() => setIsOpen(false)}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SectionFormDialog;
