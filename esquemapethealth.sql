--
-- PostgreSQL database dump
--

\restrict oDMBSkAHRZKOWa4F3g9D1QcOjWRNNWiLbT0Y33goUBq53pcLLgcy79hk66NbqPj

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-01 01:00:14

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
-- TOC entry 2 (class 3079 OID 16389)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5093 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 16634)
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    pet_id uuid,
    vet_id uuid,
    date timestamp without time zone NOT NULL,
    reason text,
    status character varying(20) DEFAULT 'Pendiente'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16611)
-- Name: clinics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(150) NOT NULL,
    address text,
    phone character varying(20),
    website text
);


ALTER TABLE public.clinics OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16661)
-- Name: medical_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medical_records (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    pet_id uuid,
    visit_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    vet_id uuid,
    clinic_id uuid,
    reason text,
    diagnosis text,
    measured_weight numeric(5,2),
    notes text
);


ALTER TABLE public.medical_records OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16415)
-- Name: pets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    name character varying(50) NOT NULL,
    species character varying(30) NOT NULL,
    breed character varying(50),
    birth_date date,
    gender character varying(10),
    weight numeric(5,2),
    photo_url text,
    is_sterilized boolean DEFAULT false,
    allergies text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pets OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16700)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vet_id uuid,
    pet_id uuid,
    owner_id uuid,
    task_type character varying(50) NOT NULL,
    description text,
    is_completed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16686)
-- Name: treatments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.treatments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    record_id uuid,
    type character varying(20),
    name character varying(100) NOT NULL,
    dosage character varying(50),
    next_due_date date,
    CONSTRAINT treatments_type_check CHECK (((type)::text = ANY ((ARRAY['VACCINE'::character varying, 'MEDICATION'::character varying, 'PROCEDURE'::character varying, 'DEWORMING'::character varying])::text[])))
);


ALTER TABLE public.treatments OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16400)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    phone character varying(20),
    address text,
    city character varying(50),
    country character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16621)
-- Name: veterinarians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.veterinarians (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    specialty character varying(100),
    clinic_id uuid
);


ALTER TABLE public.veterinarians OWNER TO postgres;

--
-- TOC entry 4922 (class 2606 OID 16645)
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- TOC entry 4918 (class 2606 OID 16620)
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (id);


--
-- TOC entry 4924 (class 2606 OID 16670)
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);


--
-- TOC entry 4916 (class 2606 OID 16427)
-- Name: pets pets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_pkey PRIMARY KEY (id);


--
-- TOC entry 4928 (class 2606 OID 16711)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 4926 (class 2606 OID 16694)
-- Name: treatments treatments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_pkey PRIMARY KEY (id);


--
-- TOC entry 4912 (class 2606 OID 16414)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4914 (class 2606 OID 16412)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4920 (class 2606 OID 16628)
-- Name: veterinarians veterinarians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veterinarians
    ADD CONSTRAINT veterinarians_pkey PRIMARY KEY (id);


--
-- TOC entry 4931 (class 2606 OID 16651)
-- Name: appointments appointments_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;


--
-- TOC entry 4932 (class 2606 OID 16646)
-- Name: appointments appointments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4933 (class 2606 OID 16732)
-- Name: appointments appointments_vet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_vet_id_fkey FOREIGN KEY (vet_id) REFERENCES public.veterinarians(id) ON DELETE SET NULL;


--
-- TOC entry 4934 (class 2606 OID 16681)
-- Name: medical_records medical_records_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id);


--
-- TOC entry 4935 (class 2606 OID 16671)
-- Name: medical_records medical_records_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;


--
-- TOC entry 4936 (class 2606 OID 16676)
-- Name: medical_records medical_records_vet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_vet_id_fkey FOREIGN KEY (vet_id) REFERENCES public.veterinarians(id);


--
-- TOC entry 4929 (class 2606 OID 16428)
-- Name: pets pets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pets
    ADD CONSTRAINT pets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4938 (class 2606 OID 16722)
-- Name: tasks tasks_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4939 (class 2606 OID 16717)
-- Name: tasks tasks_pet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE CASCADE;


--
-- TOC entry 4940 (class 2606 OID 16712)
-- Name: tasks tasks_vet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_vet_id_fkey FOREIGN KEY (vet_id) REFERENCES public.veterinarians(id);


--
-- TOC entry 4937 (class 2606 OID 16695)
-- Name: treatments treatments_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.treatments
    ADD CONSTRAINT treatments_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.medical_records(id) ON DELETE CASCADE;


--
-- TOC entry 4930 (class 2606 OID 16727)
-- Name: veterinarians veterinarians_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.veterinarians
    ADD CONSTRAINT veterinarians_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE SET NULL;


-- Completed on 2025-12-01 01:00:14

--
-- PostgreSQL database dump complete
--

\unrestrict oDMBSkAHRZKOWa4F3g9D1QcOjWRNNWiLbT0Y33goUBq53pcLLgcy79hk66NbqPj

