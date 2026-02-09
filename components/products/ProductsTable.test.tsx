import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ProductsTable, { Product, getProductsPaginated } from "./ProductsTable";
import axios from "axios";

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

jest.mock("next/image", () => {
	const MockedImage = ({
		src,
		alt,
		...props
	}: {
		src: string;
		alt: string;
		width: number;
		height: number;
	}) => {
		// eslint-disable-next-line @next/next/no-img-element
		return <img src={src} alt={alt} {...props} />;
	};
	MockedImage.displayName = "Image";
	return MockedImage;
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

jest.mock("@/features/actions/products", () => ({
	deleteProduct: jest.fn(),
}));

jest.mock("axios");

// Mock utilities
jest.mock("@/lib/utils", () => ({
	formatPlural: (
		count: number,
		options: { singular: string; plural: string },
	) => {
		return count === 1 ? `1 ${options.singular}` : `${count} ${options.plural}`;
	},
	formatPrice: (price: number) => `$${price.toFixed(2)}`,
	cn: (...classes: unknown[]) => classes.filter(Boolean).join(" "),
}));

// Mock environment variables
jest.mock("@/data/env/client", () => ({
	env: {
		NEXT_PUBLIC_SERVER_URL: "http://localhost:3000",
	},
}));

// Mock constants
jest.mock("@/data/zodSchema/product", () => ({
	PRODUCTS_LIMIT: 10,
}));

// Import React after mocks
import { ComponentType, useEffect, useState } from "react";

/**
 * Helper function to create a mock product
 */
const createMockProduct = (overrides?: Partial<Product>): Product => ({
	id: "product-1",
	name: "Test Product",
	description: "Test Description",
	imageUrl: "/test-image.jpg",
	priceInDollars: 99.99,
	status: "public",
	coursesCount: 5,
	customersCount: 100,
	...overrides,
});

/**
 * Helper function to render ProductsTable with QueryClientProvider
 * This is necessary because the component uses React Query hooks
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

describe("ProductsTable Component", () => {
	// describe is used to group related tests together.
	// Clear all mocks before each test (it \ test)
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Rendering", () => {
		it("should render the table with products", () => {
			const mockProducts = [createMockProduct()];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			// Check if the table is rendered
			expect(screen.getByRole("table")).toBeInTheDocument();

			// Check if the product name is rendered
			expect(screen.getByText("Test Product")).toBeInTheDocument();

			// Check if the price is rendered
			expect(screen.getByText("5 Courses • $99.99")).toBeInTheDocument();

			// Check if the customer count is rendered
			expect(screen.getByText("100")).toBeInTheDocument();
		});

		it("should render multiple products", () => {
			const mockProducts = [
				createMockProduct({ id: "1", name: "Product 1" }),
				createMockProduct({ id: "2", name: "Product 2" }),
				createMockProduct({ id: "3", name: "Product 3" }),
			];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={3}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("Product 1")).toBeInTheDocument();
			expect(screen.getByText("Product 2")).toBeInTheDocument();
			expect(screen.getByText("Product 3")).toBeInTheDocument();
		});

		it("should render product image with correct attributes", () => {
			const mockProducts = [
				createMockProduct({
					name: "Test Product",
					imageUrl: "/test-image.jpg",
				}),
			];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const image = screen.getByAltText("Test Product");
			expect(image).toBeInTheDocument();
			expect(image).toHaveAttribute("src", "/test-image.jpg");
		});

		it("should display correct plural format for single course", () => {
			const mockProducts = [createMockProduct({ coursesCount: 1 })];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText(/1 Course/)).toBeInTheDocument();
		});

		it("should display correct plural format for multiple courses", () => {
			const mockProducts = [createMockProduct({ coursesCount: 5 })];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText(/5 Courses/)).toBeInTheDocument();
		});
	});

	describe("Product Status", () => {
		it('should render public status with eye icon for "public" products', () => {
			const mockProducts = [createMockProduct({ status: "public" })];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const badge = screen.getByText("public");
			expect(badge).toBeInTheDocument();
		});

		it('should render private status with lock icon for "private" products', () => {
			const mockProducts = [createMockProduct({ status: "private" })];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const badge = screen.getByText("private");
			expect(badge).toBeInTheDocument();
		});
	});

	describe("Table Header", () => {
		it("should display correct header with singular product", () => {
			const mockProducts = [createMockProduct()];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("1 Product")).toBeInTheDocument();
		});

		it("should display correct header with multiple products", () => {
			const mockProducts = [
				createMockProduct({ id: "1" }),
				createMockProduct({ id: "2" }),
			];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={2}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("2 Products")).toBeInTheDocument();
		});

		it("should render all table headers", () => {
			const mockProducts = [createMockProduct()];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(
				screen.getByRole("columnheader", { name: /Product/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("columnheader", { name: /Customers/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("columnheader", { name: /Status/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("columnheader", { name: /Actions/i }),
			).toBeInTheDocument();
		});
	});

	describe("Actions", () => {
		it("should render Edit button with correct link", () => {
			const mockProducts = [createMockProduct({ id: "product-123" })];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const editButton = screen.getByRole("link", { name: /edit/i });
			expect(editButton).toBeInTheDocument();
			expect(editButton).toHaveAttribute("href", "products/product-123/edit");
		});

		it("should render Delete button", () => {
			const mockProducts = [createMockProduct()];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const deleteButton = screen.getByLabelText("Delete");
			expect(deleteButton).toBeInTheDocument();
		});
	});

	describe("Pagination", () => {
		it("should not render pagination when products count is below limit", () => {
			const mockProducts = [createMockProduct()];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={5} // Below PRODUCTS_LIMIT
					initialPage={1}
					totalPages={1}
				/>,
			);

			// Pagination should not be rendered
			// Note: You might need to adjust this based on your PRODUCTS_LIMIT value
			expect(screen.queryByTestId("pagination")).not.toBeInTheDocument();
		});
	});

	describe("Data Fetching", () => {
		it("should use initial products on first render", () => {
			const mockProducts = [
				createMockProduct({ id: "1", name: "Initial Product" }),
			];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByText("Initial Product")).toBeInTheDocument();
		});

		it("should call getProductsPaginated with correct parameters", async () => {
			const mockedAxios = axios as jest.Mocked<typeof axios>;
			const mockProducts = [createMockProduct({ name: "Fetched Product" })];

			mockedAxios.get.mockResolvedValueOnce({ data: mockProducts });

			const result = await getProductsPaginated(2);

			expect(mockedAxios.get).toHaveBeenCalledWith(
				"http://localhost:3000/api/admin/products",
				{
					params: {
						page: 2,
					},
				},
			);
			expect(result).toEqual(mockProducts);
		});
	});

	describe("Empty State", () => {
		it("should render table with no products", () => {
			renderWithQueryClient(
				<ProductsTable
					initialProducts={[]}
					productsCount={0}
					initialPage={1}
					totalPages={1}
				/>,
			);

			expect(screen.getByRole("table")).toBeInTheDocument();
			expect(screen.getByText("0 Products")).toBeInTheDocument();
		});
	});

	describe("Accessibility", () => {
		it("should have proper ARIA labels on delete button", () => {
			const mockProducts = [createMockProduct()];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const deleteButton = screen.getByLabelText("Delete");
			expect(deleteButton).toHaveAttribute("aria-label", "Delete");
		});

		it("should have proper alt text for images", () => {
			const mockProducts = [createMockProduct({ name: "Accessible Product" })];

			renderWithQueryClient(
				<ProductsTable
					initialProducts={mockProducts}
					productsCount={1}
					initialPage={1}
					totalPages={1}
				/>,
			);

			const image = screen.getByAltText("Accessible Product");
			expect(image).toBeInTheDocument();
		});
	});
});

/*
jest.mock(moduleName, factory?)
Can be:
npm package: "axios"
relative path: "./utils"
alias path: "@/lib/utils"
| Parameter    | Required   | Type        | Meaning                                   |
| ------------ | ---------- | ----------- | ----------------------------------------- |
| `moduleName` | ✅ Yes      | `string`    | The path of the module you want to mock   |
| `factory`    | ❌ Optional | `() => any` | A function that returns the mocked module |

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
This says:

“When someone imports axios, give them THIS object instead”
when not set What happens?

Jest replaces every function with jest.fn()
You configure behavior later


jest.mock("some-module", () => ({
  __esModule: true,
  default: jest.fn(),
}));
Why?

ES modules use default

Jest needs __esModule: true to behave correctly

Used a lot with:

next/dynamic

utility libraries

jest.mock("next/link", () => {
  return ({ href, children }) => (
    <a href={href}>{children}</a>
  );
});
This replaces a complex component with:

a simple one

easy to query

predictable output

jest.mock("@/lib/utils", () => ({
  ...jest.requireActual("@/lib/utils"),
  formatPrice: jest.fn(),
}));
Keeps real functions

Overrides only one
*/
