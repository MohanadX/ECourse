import Price from "@/components/products/Price";
import PurchaseButton from "@/components/products/PurchaseButton";
import SkeletonButton from "@/components/Skeletons";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { db } from "@/drizzle/db";
import {
	CourseSectionTable,
	LessonTable,
	ProductTable,
} from "@/drizzle/schema";
import { getCourseIdTag } from "@/features/course/db/cache";
import { formatPlural } from "@/features/course/db/course";
import { getCourseLessonsTag } from "@/features/lessons/db/cache";
import { wherePublicLessons } from "@/features/lessons/db/lessons";
import { getProductIdTag } from "@/features/products/db/cache";
import { wherePublicProducts } from "@/features/products/db/product";
import { getCourseSectionsTag } from "@/features/sections/db/cache";
import { wherePublicCourseSections } from "@/features/sections/db/sections";
import { and, asc, eq } from "drizzle-orm";
import { VideoIcon } from "lucide-react";
import { cacheTag } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function ProductPage({
	params,
}: {
	params: Promise<{ productId: string }>;
}) {
	const { productId } = await params;

	const product = await getPublicProduct(productId);

	if (!product) return notFound();

	const courseCount = product.courses.length;
	let lessonCount = 0;
	for (const course of product.courses) {
		for (const CourseSection of course.CourseSections) {
			lessonCount += CourseSection.lessons.length;
		}
	}

	return (
		<main className="containers my-6">
			<div className="flex justify-between items-center gap-4 max-md:flex-col-reverse">
				<div>
					<Suspense
						fallback={
							<p className="h-3 w-13 rounded-xl animate-pulse bg-gray-300"></p>
						}
					>
						<Price price={product.priceInDollars} />
					</Suspense>
					<h1 className="text-4xl font-semibold">{product.name}</h1>
					<p className="text-muted-foreground">
						{formatPlural(courseCount, {
							singular: "Course",
							plural: "Courses",
							includeCount: true,
						})}{" "}
						•{" "}
						{formatPlural(lessonCount, {
							singular: "Lesson",
							plural: "Lessons",
							includeCount: true,
						})}
					</p>
					<p className="text-xl my-6">{product.description}</p>
					<Suspense fallback={<SkeletonButton className="w-35 h-10" />}>
						<PurchaseButton productId={product.id} productSlug={product.slug} />
					</Suspense>
				</div>
				<div className="relative aspect-video rounded-xl max-w-lg grow max-md:w-full">
					<Image
						src={product.imageUrl}
						fill
						alt={product.name}
						className="object-cover rounded-xl"
					/>
				</div>
			</div>
			<div className="grid grid-cols-[repeat(auto-fit,minmax(49%,1fr))]  mt-7 gap-4">
				{product.courses.map((course) => (
					<Card key={course.id}>
						<CardHeader>
							<CardTitle>{course.name}</CardTitle>
							<CardDescription>
								{formatPlural(course.CourseSections.length, {
									singular: "Section",
									plural: "Sections",
									includeCount: true,
								})}{" "}
								•{" "}
								{formatPlural(
									course.CourseSections.reduce(
										(acc, section) => acc + section.lessons.length,
										0
									),
									{
										singular: "Lesson",
										plural: "Lessons",
										includeCount: true,
									}
								)}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Accordion type="multiple">
								{course.CourseSections.map((section) => (
									<AccordionItem key={section.id} value={section.id}>
										<AccordionTrigger>
											{/* Trigger here is flex by default */}
											<div>
												<p className="text-lg">{section.name}</p>
												<p className="text-muted-foreground pl-2">
													{formatPlural(section.lessons.length, {
														singular: "Lesson",
														plural: "Lessons",
														includeCount: true,
													})}
												</p>
											</div>
										</AccordionTrigger>
										<AccordionContent className="flex flex-col gap-2">
											{section.lessons.map((lesson) => (
												<article
													key={lesson.id}
													className="flex items-center p-3 gap-2 text-base"
												>
													<VideoIcon className="size-4" />
													{lesson.status === "preview" ? (
														<Link
															href={`/courses/${course.id}/${course.slug}/lessons/${lesson.id}`}
															className="underline text-accent"
														>
															{lesson.name}
														</Link>
													) : (
														lesson.name
													)}
												</article>
											))}
										</AccordionContent>
									</AccordionItem>
								))}
							</Accordion>
						</CardContent>
					</Card>
				))}
			</div>
		</main>
	);
}

async function getPublicProduct(id: string) {
	"use cache";
	cacheTag(getProductIdTag(id));

	const product = await db.query.ProductTable.findFirst({
		columns: {
			id: true,
			name: true,
			slug: true,
			description: true,
			priceInDollars: true,
			imageUrl: true,
		},
		where: and(eq(ProductTable.id, id), wherePublicProducts),
		with: {
			CourseProducts: {
				columns: {},
				with: {
					course: {
						columns: {
							id: true,
							name: true,
							slug: true,
						},
						with: {
							CourseSections: {
								columns: {
									id: true,
									name: true,
								},
								where: wherePublicCourseSections,
								orderBy: asc(CourseSectionTable.order),
								with: {
									lessons: {
										columns: {
											id: true,
											name: true,
											status: true,
										},
										where: wherePublicLessons,
										orderBy: asc(LessonTable.order),
									},
								},
							},
						},
					},
				},
			},
		},
	});

	if (!product) return product;

	// in case lesson or sections or courses changed
	cacheTag(
		...product.CourseProducts.flatMap((cp) => [
			getCourseLessonsTag(cp.course.id),
			getCourseSectionsTag(cp.course.id),
			getCourseIdTag(cp.course.id),
		])
	);

	const { CourseProducts, ...other } = product;

	return {
		...other,
		courses: CourseProducts.map((cp) => cp.course), // for naming conventions
	};
}
