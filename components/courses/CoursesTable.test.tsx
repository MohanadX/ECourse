import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CoursesTable, { Course } from "./CoursesTable";
import axios from "axios";
import { ComponentType, useEffect, useState } from "react";

// Mock external dependencies
jest.mock("next/link", () => {
	const MockedLink = ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => {
		return <a href={href}>{children}</a>;
	};
	MockedLink.displayName = "Link";
	return MockedLink;
});

jest.mock("next/dynamic", () => ({
	__esModule: true,
	default: (fn: () => Promise<unknown>) => {
		const Component = (props: unknown) => {
			const [Comp, setComp] = useState<ComponentType<unknown> | null>(null);
			useEffect(() => {
				fn().then((mod: unknown) => {
					const modContent = mod as { default?: ComponentType<unknown> };
					setComp(() => modContent.default || (mod as ComponentType<unknown>));
				});
			}, []);
			return Comp ? <Comp {...(props as object)} /> : null;
		};
		Component.displayName = "DynamicComponent";
		return Component;
	},
}));

jest.mock("@/features/actions/course", () => ({
	deleteCourse: jest.fn(),
}));

jest.mock("axios");

// Mock utilities
jest.mock("@/lib/utils", () => ({
	formatPlural: (
		count: number,
		options: { singular: string; plural: string; includeCount?: boolean },
	) => {
		const label = count === 1 ? options.singular : options.plural;
		return options.includeCount ? `${count} ${label}` : label;
	},
	cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
}));

// Mock environment variables
jest.mock("@/data/env/client", () => ({
	env: {
		NEXT_PUBLIC_SERVER_URL: "http://localhost:3000",
	},
}));

// Mock constants
jest.mock("@/data/zodSchema/course", () => ({
	COURSES_LIMIT: 10,
}));

// Mock ActionButton to avoid complex interactions in unit tests if needed,
// but ProductsTable test didn't mock it entirely, just the action.
// However, ActionButton might use useFormStatus which needs a provider.
// Let's see if it works without mocking ActionButton first, as ProductsTable used it directly.

/**
 * Helper function to create a mock course
 */
const createMockCourse = (overrides?: Partial<Course>) => ({
	id: "course-1",
	name: "Test Course",
	sectionsCount: 5,
	lessonsCount: 20,
	studentsCount: 100,
	...overrides,
});

/**
 * Helper function to render CoursesTable with QueryClientProvider
 */
const renderWithQueryClient = (ui: React.ReactElement) => {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				retry: false, // Disable retries in tests
			},
		},
	});

	return render(
		<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
	);
};

describe("CoursesTable Component", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Rendering", () => {
		it("should render the table with courses", () => {
			const mockCourses = [createMockCourse()];

			renderWithQueryClient(
				<CoursesTable
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			// Check if the table is rendered
			expect(screen.getByRole("table")).toBeInTheDocument();

			// Check if the course name is rendered
			expect(screen.getByText("Test Course")).toBeInTheDocument();

			// Check if the sections/lessons count is rendered
			// Based on our mock formatPlural:
			expect(screen.getByText(/5 sections/)).toBeInTheDocument();
			expect(screen.getByText(/20 lessons/)).toBeInTheDocument();

			// Check if the students count is rendered
			expect(screen.getByText("100")).toBeInTheDocument();
		});

		it("should render multiple courses", () => {
			const mockCourses = [
				createMockCourse({ id: "1", name: "Course 1" }),
				createMockCourse({ id: "2", name: "Course 2" }),
			];

			renderWithQueryClient(
				<CoursesTable
					initialCourses={mockCourses}
					coursesCount={2}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("Course 1")).toBeInTheDocument();
			expect(screen.getByText("Course 2")).toBeInTheDocument();
		});

		it("should display correct plural format for single section/lesson", () => {
			const mockCourses = [
				createMockCourse({ sectionsCount: 1, lessonsCount: 1 }),
			];

			renderWithQueryClient(
				<CoursesTable
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText(/1 section/)).toBeInTheDocument();
			expect(screen.getByText(/1 lesson/)).toBeInTheDocument();
		});
	});

	describe("Table Header", () => {
		it("should display correct header with singular course", () => {
			const mockCourses = [createMockCourse()];

			renderWithQueryClient(
				<CoursesTable
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			// Uses formatPlural without includeCount in header for "1 Course" based on observation?
			// Checking CoursesTable.tsx: formatPlural(courses!.length, { singular: "Course", plural: "Courses" })
			// Our mock: count === 1 ? singular : plural -> "Course"
			// Wait, if ProductsTable test expected "1 Product", it means formatPlural mock in that file
			// was returning `${count} ${label}`.
			// Let's check ProductsTable.test.tsx again.
			// line 69: return count === 1 ? `1 ${options.singular}` : `${count} ${options.plural}`;
			// My mock above: return options.includeCount ? `${count} ${label}` : label;
			// I should adjust my mock to match the component's expectation if distinct behavior is needed.
			// In CoursesTable.tsx line 75: formatPlural(..., { singular: "Course", plural: "Courses" }) -> No includeCount.
			// So it should just be "Course" or "Courses" if I follow my mock logic?
			// But check ProductsTable.tsx line 83: same usage.
			// Check ProductsTable.test.tsx line 277: expect(screen.getByText("1 Product")).toBeInTheDocument();
			// So the mock in ProductsTable.test.tsx forces "1 " prefix.
			// But in CoursesTable.tsx line 92, it uses `includeCount: true`.
			// So I need to support both.
			// I will update my mock to match ProductsTable.test.tsx logic BUT handle includeCount.
			// Actually, let's look at the component code again.
			// CoursesTable header: formatPlural(courses!.length, { singular: "Course", plural: "Courses" })
			// CoursesTable body: formatPlural(course.sectionsCount, { ..., includeCount: true })

			// If I look at the ProductsTable.test.tsx mock:
			// formatPlural: (count, options) => count === 1 ? `1 ${options.singular}` : `${count} ${options.plural}`
			// It ALWAYS includes count.

			expect(screen.getByText("Course")).toBeInTheDocument(); // My current mock logic for header
		});

		// Let's just fix the mock to be consistent with what I expect.
		// If I want to match ProductsTable tests, found in Step 5, line 65:
		// formatPlural: (count, options) => count === 1 ? `1 ${options.singular}` : `${count} ${options.plural}`
		// This mock IGNORES includeCount option if passed in options object (since it doesn't destructure it).
		// But CoursesTable uses includeCount: true.
		// So I should write a better mock that respects includeCount if present, or defaults to something?
		// Real utils.ts likely handles this.
		// I will stick to my mock which handles includeCount.
		// Component usage:
		// Header: formatPlural(len, {singular: "Course", plural: "Courses"}) -> "Course" or "Courses" (with my mock)
		// Body: formatPlural(cnt, {..., includeCount: true}) -> "5 sections"

		it("should render all table headers", () => {
			const mockCourses = [createMockCourse()];

			renderWithQueryClient(
				<CoursesTable
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(
				screen.getByRole("columnheader", { name: /Course/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("columnheader", { name: /Students/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("columnheader", { name: /Actions/i }),
			).toBeInTheDocument();
		});
	});

	describe("Actions", () => {
		it("should render Edit button with correct link", () => {
			const mockCourses = [createMockCourse({ id: "course-123" })];

			renderWithQueryClient(
				<CoursesTable
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const editButton = screen.getByRole("link", { name: /edit/i });
			expect(editButton).toBeInTheDocument();
			expect(editButton).toHaveAttribute("href", "courses/course-123/edit");
		});

		it("should render Delete button", () => {
			const mockCourses = [createMockCourse()];

			renderWithQueryClient(
				<CoursesTable
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const deleteButton = screen.getByLabelText("Delete");
			expect(deleteButton).toBeInTheDocument();
		});
	});

	describe("Pagination", () => {
		it("should not render pagination when courses count is below limit", () => {
			const mockCourses = [createMockCourse()];

			renderWithQueryClient(
				<CoursesTable
					initialCourses={mockCourses}
					coursesCount={5} // Below COURSES_LIMIT (10)
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
		});
	});

	describe("Data Fetching", () => {
		it("should use initial courses on first render", () => {
			const mockCourses = [
				createMockCourse({ id: "1", name: "Initial Course" }),
			];

			renderWithQueryClient(
				<CoursesTable
					initialCourses={mockCourses}
					coursesCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("Initial Course")).toBeInTheDocument();
		});

		// Skip complex axios mock test for now as the function isn't exported in a way
		// that's easily testable separately without e2e or more complex setups,
		// OR we can test that axios is called when page changes if we could trigger it.
		// But Pagination is mocked or dynamic.
		// ProductsTable.test.tsx exported `getProductsPaginated` to test logic.
		// CoursesTable.tsx does NOT export `getCoursesPaginated` in the snippet I saw?
		// Let's check CoursesTable.tsx content again.
		// Line 40: async function getCoursesPaginated(page: number): Promise<Course[]> { ... }
		// It is NOT exported. So I cannot unit test `getCoursesPaginated` directly like ProductsTable did.
		// I will omit that test or export it if I were modifying the file, but I am just adding tests.
		// I will skip testing the internal API call function directly.
	});

	describe("Empty State", () => {
		it("should render table with no courses", () => {
			renderWithQueryClient(
				<CoursesTable
					initialCourses={[]}
					coursesCount={0}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByRole("table")).toBeInTheDocument();
			// With my mock, 0 plural -> "Courses"
			expect(screen.getByText("Courses")).toBeInTheDocument();
		});
	});
});
