--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0 (Debian 17.0-1.pgdg120+1)
-- Dumped by pg_dump version 17.0 (Debian 17.0-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO postgres;

--
-- Name: course_section_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.course_section_status AS ENUM (
    'public',
    'private'
);


ALTER TYPE public.course_section_status OWNER TO postgres;

--
-- Name: lessons_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.lessons_status AS ENUM (
    'public',
    'private',
    'preview'
);


ALTER TYPE public.lessons_status OWNER TO postgres;

--
-- Name: product_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.product_status AS ENUM (
    'public',
    'private'
);


ALTER TYPE public.product_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'user',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: postgres
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: postgres
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO postgres;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: postgres
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: course_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_products (
    "courseId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.course_products OWNER TO postgres;

--
-- Name: course_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    status public.course_section_status DEFAULT 'private'::public.course_section_status NOT NULL,
    "order" integer NOT NULL,
    "courseId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.course_sections OWNER TO postgres;

--
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    slug text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "userId" uuid
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- Name: lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    "youtubeVideoId" text NOT NULL,
    "order" integer NOT NULL,
    status public.lessons_status DEFAULT 'private'::public.lessons_status NOT NULL,
    "sectionId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.lessons OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    "imageUrl" text NOT NULL,
    "priceInDollars" integer NOT NULL,
    status public.product_status DEFAULT 'private'::public.product_status NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "imageFileId" text NOT NULL,
    "userId" uuid
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: purchase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "pricePaidInCents" integer NOT NULL,
    "productDetails" jsonb NOT NULL,
    "userId" uuid NOT NULL,
    "productId" uuid NOT NULL,
    "stripeSessionId" text NOT NULL,
    "refundedAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
    "adminId" uuid
);


ALTER TABLE public.purchase OWNER TO postgres;

--
-- Name: user_course_access; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_course_access (
    "userId" uuid NOT NULL,
    "courseId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_course_access OWNER TO postgres;

--
-- Name: user_lesson_complete; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_lesson_complete (
    "userId" uuid NOT NULL,
    "lessonId" uuid NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_lesson_complete OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "clerkUserId" text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    role public.user_role DEFAULT 'admin'::public.user_role NOT NULL,
    "imageUrl" text,
    "deletedAt" timestamp with time zone,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: postgres
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	7c056940b913ba260bcaf2d818c307f508c89356a7201357048b46c2211309ef	1765549862612
2	af0c8647274bcaf0f0ea4899c7d0de171ab9afcaa7fcde3f6126f2af721f84f0	1767544100281
3	1356d40e5d947fb2077529bbbf1eb08781db1ce464939f9560c0f172c8e742d5	1767721291547
4	aa4c3aa6b6f200a28e5fe526a22acaa1f679743eedda9f8f11c0fd7d67d17bac	1768571474696
5	ba9e9a341cca12185eaaff7ae05594a44308d78d1a0e8aff9da56a20a9d7dac6	1768577524418
\.


--
-- Data for Name: course_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_products ("courseId", "productId", "createdAt", "updatedAt") FROM stdin;
1338912a-ca67-4748-b262-1cf490e43adf	1ac56329-0d37-45a9-9856-d4c5336658ea	2026-01-06 19:03:07.50326+00	2026-01-06 19:03:07.50326+00
9f0e9fa5-0f93-4744-be43-de103890417e	bda1232d-1939-4999-af76-83b61f616412	2026-01-08 19:44:27.41434+00	2026-01-08 19:44:27.41434+00
dfa243da-1050-46e8-abf0-2d9a103ce11f	e62cb97c-0b41-40ae-9743-03e79afde0cd	2026-01-17 13:38:10.623619+00	2026-01-17 13:38:10.623619+00
1338912a-ca67-4748-b262-1cf490e43adf	66d9e79e-0469-470a-bfeb-b32a47b8fca3	2026-01-18 11:11:36.009497+00	2026-01-18 11:11:36.009497+00
9f0e9fa5-0f93-4744-be43-de103890417e	66d9e79e-0469-470a-bfeb-b32a47b8fca3	2026-01-18 11:11:36.009497+00	2026-01-18 11:11:36.009497+00
\.


--
-- Data for Name: course_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_sections (id, name, status, "order", "courseId", "createdAt", "updatedAt") FROM stdin;
baa14662-d1f3-4211-9b60-9d1b8c8f37a7	Type Alias	public	1	9f0e9fa5-0f93-4744-be43-de103890417e	2026-01-04 13:10:43.956067+00	2026-01-04 13:17:18.904+00
5fe31a2c-813c-4605-b4b6-fc761ae213f4	primary info	public	0	9f0e9fa5-0f93-4744-be43-de103890417e	2026-01-03 16:12:06.053659+00	2026-01-04 13:17:18.904+00
4d8baeaf-ab89-4ec9-ac2f-fb69fe3515a2	dfaeff	private	0	c5e5ac5d-48c0-4f63-83ea-e86a1af499d8	2026-01-09 19:39:07.061626+00	2026-01-09 19:39:17.087+00
691193f2-5019-4ea7-b1b5-9c5638dd7206	Introduction	public	0	dfa243da-1050-46e8-abf0-2d9a103ce11f	2026-01-16 16:29:03.530612+00	2026-01-17 13:10:00.555+00
88b600da-731b-45bb-abbb-8b1861fafba4	Data types	public	1	dfa243da-1050-46e8-abf0-2d9a103ce11f	2026-01-16 16:32:31.993099+00	2026-01-17 13:10:00.555+00
e73f1acc-a1bd-492f-b1c3-765ee95b92d0	Nullish coalising	public	0	1338912a-ca67-4748-b262-1cf490e43adf	2025-12-29 12:00:03.088131+00	2026-01-18 12:59:55.012+00
20db10db-ba08-409d-97f0-4219798c61e6	Fetch API	private	1	1338912a-ca67-4748-b262-1cf490e43adf	2026-01-03 08:32:39.765779+00	2026-01-18 12:59:55.012+00
ed6c27bb-8910-41e3-b4a1-fe04f84fef88	logical comparisons	public	2	1338912a-ca67-4748-b262-1cf490e43adf	2025-12-29 11:16:06.822882+00	2026-01-18 12:59:55.012+00
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (id, name, description, slug, "createdAt", "updatedAt", "userId") FROM stdin;
1338912a-ca67-4748-b262-1cf490e43adf	JS Basics	This is a simple JS basics course	js-basics	2025-12-24 14:36:24.408406+00	2026-01-07 14:52:16.153+00	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
9f0e9fa5-0f93-4744-be43-de103890417e	Typescript Basics	This is a simple Typescript basics course	typescript-basics	2026-01-03 16:10:13.059723+00	2026-01-04 13:17:06.54+00	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
c5e5ac5d-48c0-4f63-83ea-e86a1af499d8	test	test course	test	2026-01-09 19:38:50.038083+00	2026-01-09 19:39:40.595+00	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
dfa243da-1050-46e8-abf0-2d9a103ce11f	Python	This is Python basics course for beginners in programming with experienced instructor (Elzero)	python	2026-01-16 16:28:38.345547+00	2026-01-17 13:24:47.664+00	060187d4-568d-49ca-bc05-120aa29c0a61
\.


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lessons (id, name, description, "youtubeVideoId", "order", status, "sectionId", "createdAt", "updatedAt") FROM stdin;
dcaab389-c2bf-4f2d-b26c-01544aa7a4d7	Data types in python	what are the various data types in python	43lT7k0Zws0	0	public	88b600da-731b-45bb-abbb-8b1861fafba4	2026-01-16 16:33:21.04623+00	2026-01-16 16:33:21.04623+00
0aedf611-e66e-4eb1-bfd7-a1ea35856027	fallback values	using nullish coalising operator for fallback values is a famous strategy for defensive programming	-VU6Gumxs4k	0	preview	e73f1acc-a1bd-492f-b1c3-765ee95b92d0	2026-01-03 14:33:27.005708+00	2026-01-07 14:52:06.675+00
0f721b3b-f884-4337-a832-307a8f21dd60	Introduction to Python	what is python and what purpose does it have	mvZHDpCHphk	0	preview	691193f2-5019-4ea7-b1b5-9c5638dd7206	2026-01-16 16:30:53.607885+00	2026-01-17 13:05:42.247+00
afee7890-a2e6-4f53-ad18-536e395ac893	Requirements for learing	what do you need to learn python 	02a5T6ktx8M	1	public	691193f2-5019-4ea7-b1b5-9c5638dd7206	2026-01-16 16:32:04.167631+00	2026-01-17 13:05:42.247+00
ecdddebb-f2bf-4691-aad3-7449b38a02c3	loosie comparison	Loosie comparison that compare between values regardless of the values type (string, number ...etc) 	dfaefafeaf	1	public	ed6c27bb-8910-41e3-b4a1-fe04f84fef88	2026-01-03 14:23:20.983989+00	2026-01-07 16:49:42.206+00
e9010c74-5406-47b8-946d-08f870304898	Identical comparison	Identical comparison which compare values with their types so they must be identical in both value and type	fdfafafe	0	public	ed6c27bb-8910-41e3-b4a1-fe04f84fef88	2026-01-03 14:24:28.511955+00	2026-01-07 16:49:42.206+00
bef1d8a6-685c-46ad-a967-ae0410eef3f9	AJAX	approach of fetching data using XML with Javascript which was the old official way to fetch data 	X-RkZHyzidc	0	public	20db10db-ba08-409d-97f0-4219798c61e6	2026-01-03 16:01:07.658853+00	2026-01-07 16:49:45.749+00
d5e8948d-d641-4885-a9b8-655375b32bbd	Fetch API	a latest approach of fetching data which is now the most common way is to use fetch browser API 	oO0a7tQcGps	1	public	20db10db-ba08-409d-97f0-4219798c61e6	2026-01-03 16:02:39.916181+00	2026-01-07 16:49:45.749+00
13696d66-2d6c-4334-aa79-71553443941f	interfaces	what is interfaces in TS and their main purpose	qopmfZ30_TQ	1	public	baa14662-d1f3-4211-9b60-9d1b8c8f37a7	2026-01-04 13:16:38.520286+00	2026-01-04 13:17:26.615+00
bca3807a-51c6-4afa-a85b-8edebb8f959a	Types	what is Types in TS which is the main feature in this language	TWTt63RJ3ic	0	public	baa14662-d1f3-4211-9b60-9d1b8c8f37a7	2026-01-04 13:15:21.522728+00	2026-01-04 13:49:50.804+00
711792d8-857d-47f0-b977-96bc4bd43af8	Introduction to Typescript	small introduction to typescript basics and purpose of this language	yUndnE-2osg	0	preview	5fe31a2c-813c-4605-b4b6-fc761ae213f4	2026-01-03 16:12:20.189204+00	2026-01-04 13:15:36.642+00
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, slug, name, description, "imageUrl", "priceInDollars", status, "createdAt", "updatedAt", "imageFileId", "userId") FROM stdin;
e62cb97c-0b41-40ae-9743-03e79afde0cd	python-basics	Python Basics	This is product of Python basics course	https://ik.imagekit.io/n0rxaa0i2/ecourse/products/0_FNIfBkJjBWx0S_gr_jpg_DgBp1p8Ev	0	public	2026-01-16 16:41:39.96059+00	2026-01-17 13:38:10.626+00	696a6a425c7cd75eb8f2a21c	060187d4-568d-49ca-bc05-120aa29c0a61
1ac56329-0d37-45a9-9856-d4c5336658ea	js-basics	JS Basics	This is JS basics course for web development beginners	https://ik.imagekit.io/n0rxaa0i2/ecourse/products/JavaScript_course_promotional_banner_png_n3nUvwQs4	40	public	2026-01-06 19:03:07.50326+00	2026-01-06 19:03:07.50326+00	695d5c705c7cd75eb8e7203b	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
bda1232d-1939-4999-af76-83b61f616412	ts-basics	TS Basics	This is TS basics course for beginner	https://ik.imagekit.io/n0rxaa0i2/ecourse/products/TS-course_png_k_Sa5_UMj	60	public	2026-01-06 19:21:38.787267+00	2026-01-08 19:44:27.419+00	695d60c75c7cd75eb80d2049	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
66d9e79e-0469-470a-bfeb-b32a47b8fca3	bundle	Bundle	Bundle product for both 2 courses of JS and TS with great price	https://ik.imagekit.io/n0rxaa0i2/ecourse/products/justin-ha-ER3BuRKBJ2g-unsplash_jpg_qOBJOSOdT0	90	public	2026-01-06 19:23:48.106276+00	2026-01-18 11:11:36.01+00	695d61495c7cd75eb8109bec	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
\.


--
-- Data for Name: purchase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase (id, "pricePaidInCents", "productDetails", "userId", "productId", "stripeSessionId", "refundedAt", "createdAt", "updatedAt", "adminId") FROM stdin;
0a0337da-0db4-4ede-befe-fba3cdce93e1	3000	{"name": "TS Basics", "imageUrl": "https://ik.imagekit.io/n0rxaa0i2/ecourse/products/TS-course_png_k_Sa5_UMj", "description": "This is TS basics course for beginner"}	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6	bda1232d-1939-4999-af76-83b61f616412	cs_test_a1gBgyWzqXOObAxbPIxGbYsMdE3TR9RAzENk8xCIFFTcc0kJF14gmpomLw	2026-01-13 18:05:54.645+00	2026-01-10 15:40:16.763029+00	2026-01-13 18:05:54.649+00	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
a927da7e-5ba4-4d9d-8982-56ea5b3d41e4	2000	{"name": "JS Basics", "imageUrl": "https://ik.imagekit.io/n0rxaa0i2/ecourse/products/JavaScript_course_promotional_banner_png_n3nUvwQs4", "description": "This is JS basics course for web development beginners"}	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6	1ac56329-0d37-45a9-9856-d4c5336658ea	cs_test_a1HQux8DedbQNQv5e5OSvyfxMzEakv8fYtlpGcjmnqj87VFYvXM7zQg43X	\N	2026-01-10 14:29:41.290515+00	2026-01-10 14:29:41.290515+00	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
31f8baa1-b189-4dce-8f5d-a91e0723a22c	9000	{"name": "Bundle", "imageUrl": "https://ik.imagekit.io/n0rxaa0i2/ecourse/products/justin-ha-ER3BuRKBJ2g-unsplash_jpg_qOBJOSOdT0", "description": "Bundle product for both 2 courses of JS and TS with great price"}	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6	66d9e79e-0469-470a-bfeb-b32a47b8fca3	cs_test_a1ddrd6yhBi0tMx6U4QU03J9tyr0s89ptCSTwdt0rYPEgWbEfyiJdSEwFX	2026-01-12 20:03:55.736+00	2026-01-12 15:57:12.508995+00	2026-01-12 20:03:55.739+00	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
2c090f21-825b-4c78-b6a4-56b3b88f8b81	0	{"name": "Python Basics", "imageUrl": "https://ik.imagekit.io/n0rxaa0i2/ecourse/products/0_FNIfBkJjBWx0S_gr_jpg_DgBp1p8Ev", "description": "This is product of Python basics course"}	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6	e62cb97c-0b41-40ae-9743-03e79afde0cd	cs_test_a1KlEn2fZOmglbSRItgtuBPSqhFNjIta58oChirYrBV1dfmlgNLrK6bqWW	\N	2026-01-16 17:13:13.17258+00	2026-01-16 17:13:13.17258+00	060187d4-568d-49ca-bc05-120aa29c0a61
0330fbee-743b-43e5-89d4-569b0bc84951	9000	{"name": "Bundle", "imageUrl": "https://ik.imagekit.io/n0rxaa0i2/ecourse/products/justin-ha-ER3BuRKBJ2g-unsplash_jpg_qOBJOSOdT0", "description": "Bundle product for both 2 courses of JS and TS with great price"}	060187d4-568d-49ca-bc05-120aa29c0a61	66d9e79e-0469-470a-bfeb-b32a47b8fca3	cs_test_a1Nc7ooTempSOxPOmyGvsH4hlhoa8CivO1SVjCvFjL0euYpwpnmqHFJW0l	\N	2026-01-16 17:16:17.711838+00	2026-01-16 17:16:17.711838+00	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
3c0906ff-3ad5-4e05-a8f5-8d1aa12166d5	9000	{"name": "Bundle", "imageUrl": "https://ik.imagekit.io/n0rxaa0i2/ecourse/products/justin-ha-ER3BuRKBJ2g-unsplash_jpg_qOBJOSOdT0", "description": "Bundle product for both 2 courses of JS and TS with great price"}	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6	66d9e79e-0469-470a-bfeb-b32a47b8fca3	cs_test_a1BlRfwHX8etB2Xim7ssrlohk1nNaNFmSEJvCwR5gnlkpyZqkmBNtk3hRy	\N	2026-01-18 14:28:54.18624+00	2026-01-18 14:28:54.18624+00	dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6
\.


--
-- Data for Name: user_course_access; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_course_access ("userId", "courseId", "createdAt", "updatedAt") FROM stdin;
dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6	1338912a-ca67-4748-b262-1cf490e43adf	2026-01-10 14:29:41.290515+00	2026-01-10 14:29:41.290515+00
dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6	dfa243da-1050-46e8-abf0-2d9a103ce11f	2026-01-16 17:13:13.17258+00	2026-01-16 17:13:13.17258+00
060187d4-568d-49ca-bc05-120aa29c0a61	1338912a-ca67-4748-b262-1cf490e43adf	2026-01-16 17:16:17.711838+00	2026-01-16 17:16:17.711838+00
060187d4-568d-49ca-bc05-120aa29c0a61	9f0e9fa5-0f93-4744-be43-de103890417e	2026-01-16 17:16:17.711838+00	2026-01-16 17:16:17.711838+00
dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6	9f0e9fa5-0f93-4744-be43-de103890417e	2026-01-18 14:28:54.18624+00	2026-01-18 14:28:54.18624+00
\.


--
-- Data for Name: user_lesson_complete; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_lesson_complete ("userId", "lessonId", "createdAt", "updatedAt") FROM stdin;
060187d4-568d-49ca-bc05-120aa29c0a61	e9010c74-5406-47b8-946d-08f870304898	2026-01-16 18:30:34.342002+00	2026-01-16 18:30:34.342002+00
dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6	0aedf611-e66e-4eb1-bfd7-a1ea35856027	2026-01-17 19:36:48.83716+00	2026-01-17 19:36:48.83716+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, "clerkUserId", email, name, role, "imageUrl", "deletedAt", "createdAt", "updatedAt") FROM stdin;
060187d4-568d-49ca-bc05-120aa29c0a61	user_38LVEsQ0okMcx5UJ4yXdYDYyMOO	mohanadayoubx@gmail.com	Mohanad Ayoub	admin	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zOExWRXhSUFVhNXBpem82U2cyNHJTcUNEaU4ifQ	\N	2026-01-16 15:52:09.76378+00	2026-01-16 15:56:36.203+00
dc700f19-2a0a-40db-aa3f-f5ed54dc9fa6	user_36vk816tAqCvpOsAElw3KYzvf2V	alaqlmhnd3@gmail.com	Mohanad Ayoub	admin	https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ2l0aHViL2ltZ18zNnZrODVzV0x2cHZoaVNHZUlFMWpuM0F2a3oifQ	\N	2025-12-16 14:11:10.348595+00	2026-01-10 18:21:19.136+00
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: postgres
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 5, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: postgres
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: course_products course_products_courseId_productId_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_products
    ADD CONSTRAINT "course_products_courseId_productId_pk" PRIMARY KEY ("courseId", "productId");


--
-- Name: course_sections course_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_sections
    ADD CONSTRAINT course_sections_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: purchase purchase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT purchase_pkey PRIMARY KEY (id);


--
-- Name: purchase purchase_stripeSessionId_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT "purchase_stripeSessionId_unique" UNIQUE ("stripeSessionId");


--
-- Name: user_course_access user_course_access_userId_courseId_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_course_access
    ADD CONSTRAINT "user_course_access_userId_courseId_pk" PRIMARY KEY ("userId", "courseId");


--
-- Name: user_lesson_complete user_lesson_complete_userId_lessonId_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_lesson_complete
    ADD CONSTRAINT "user_lesson_complete_userId_lessonId_pk" PRIMARY KEY ("userId", "lessonId");


--
-- Name: users users_clerkUserId_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_clerkUserId_unique" UNIQUE ("clerkUserId");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: course_products course_products_courseId_courses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_products
    ADD CONSTRAINT "course_products_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE RESTRICT;


--
-- Name: course_products course_products_productId_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_products
    ADD CONSTRAINT "course_products_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: course_sections course_sections_courseId_courses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_sections
    ADD CONSTRAINT "course_sections_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: courses courses_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "courses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: lessons lessons_sectionId_course_sections_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT "lessons_sectionId_course_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES public.course_sections(id) ON DELETE CASCADE;


--
-- Name: products products_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT "products_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: purchase purchase_adminId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT "purchase_adminId_users_id_fk" FOREIGN KEY ("adminId") REFERENCES public.users(id);


--
-- Name: purchase purchase_productId_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT "purchase_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- Name: purchase purchase_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase
    ADD CONSTRAINT "purchase_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: user_course_access user_course_access_courseId_courses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_course_access
    ADD CONSTRAINT "user_course_access_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: user_course_access user_course_access_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_course_access
    ADD CONSTRAINT "user_course_access_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_lesson_complete user_lesson_complete_lessonId_lessons_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_lesson_complete
    ADD CONSTRAINT "user_lesson_complete_lessonId_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: user_lesson_complete user_lesson_complete_userId_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_lesson_complete
    ADD CONSTRAINT "user_lesson_complete_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

