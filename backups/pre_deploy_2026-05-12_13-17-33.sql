--
-- PostgreSQL database dump
--

\restrict dubzsIKtWbBdPqUJBqyRud9hXwHwRbdY245GIy4apijwPSrQAF7v7X5ebS3Zjrl

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: evolution; Type: SCHEMA; Schema: -; Owner: bravapos_user
--

CREATE SCHEMA evolution;


ALTER SCHEMA evolution OWNER TO bravapos_user;

--
-- Name: DeviceMessage; Type: TYPE; Schema: evolution; Owner: bravapos_user
--

CREATE TYPE evolution."DeviceMessage" AS ENUM (
    'ios',
    'android',
    'web',
    'unknown',
    'desktop'
);


ALTER TYPE evolution."DeviceMessage" OWNER TO bravapos_user;

--
-- Name: DifyBotType; Type: TYPE; Schema: evolution; Owner: bravapos_user
--

CREATE TYPE evolution."DifyBotType" AS ENUM (
    'chatBot',
    'textGenerator',
    'agent',
    'workflow'
);


ALTER TYPE evolution."DifyBotType" OWNER TO bravapos_user;

--
-- Name: InstanceConnectionStatus; Type: TYPE; Schema: evolution; Owner: bravapos_user
--

CREATE TYPE evolution."InstanceConnectionStatus" AS ENUM (
    'open',
    'close',
    'connecting'
);


ALTER TYPE evolution."InstanceConnectionStatus" OWNER TO bravapos_user;

--
-- Name: OpenaiBotType; Type: TYPE; Schema: evolution; Owner: bravapos_user
--

CREATE TYPE evolution."OpenaiBotType" AS ENUM (
    'assistant',
    'chatCompletion'
);


ALTER TYPE evolution."OpenaiBotType" OWNER TO bravapos_user;

--
-- Name: SessionStatus; Type: TYPE; Schema: evolution; Owner: bravapos_user
--

CREATE TYPE evolution."SessionStatus" AS ENUM (
    'opened',
    'closed',
    'paused'
);


ALTER TYPE evolution."SessionStatus" OWNER TO bravapos_user;

--
-- Name: TriggerOperator; Type: TYPE; Schema: evolution; Owner: bravapos_user
--

CREATE TYPE evolution."TriggerOperator" AS ENUM (
    'contains',
    'equals',
    'startsWith',
    'endsWith',
    'regex'
);


ALTER TYPE evolution."TriggerOperator" OWNER TO bravapos_user;

--
-- Name: TriggerType; Type: TYPE; Schema: evolution; Owner: bravapos_user
--

CREATE TYPE evolution."TriggerType" AS ENUM (
    'all',
    'keyword',
    'none',
    'advanced'
);


ALTER TYPE evolution."TriggerType" OWNER TO bravapos_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Chat; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Chat" (
    id text NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    labels jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "instanceId" text NOT NULL,
    name character varying(100),
    "unreadMessages" integer DEFAULT 0 NOT NULL
);


ALTER TABLE evolution."Chat" OWNER TO bravapos_user;

--
-- Name: Chatwoot; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Chatwoot" (
    id text NOT NULL,
    enabled boolean DEFAULT true,
    "accountId" character varying(100),
    token character varying(100),
    url character varying(500),
    "nameInbox" character varying(100),
    "signMsg" boolean DEFAULT false,
    "signDelimiter" character varying(100),
    number character varying(100),
    "reopenConversation" boolean DEFAULT false,
    "conversationPending" boolean DEFAULT false,
    "mergeBrazilContacts" boolean DEFAULT false,
    "importContacts" boolean DEFAULT false,
    "importMessages" boolean DEFAULT false,
    "daysLimitImportMessages" integer,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    logo character varying(500),
    organization character varying(100),
    "ignoreJids" jsonb
);


ALTER TABLE evolution."Chatwoot" OWNER TO bravapos_user;

--
-- Name: Contact; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Contact" (
    id text NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "pushName" character varying(100),
    "profilePicUrl" character varying(500),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Contact" OWNER TO bravapos_user;

--
-- Name: Dify; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Dify" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "botType" evolution."DifyBotType" NOT NULL,
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" evolution."TriggerType",
    "triggerOperator" evolution."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    description character varying(255),
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution."Dify" OWNER TO bravapos_user;

--
-- Name: DifySetting; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."DifySetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "difyIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution."DifySetting" OWNER TO bravapos_user;

--
-- Name: Evoai; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Evoai" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    description character varying(255),
    "agentUrl" character varying(255),
    "apiKey" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50,
    "triggerType" evolution."TriggerType",
    "triggerOperator" evolution."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Evoai" OWNER TO bravapos_user;

--
-- Name: EvoaiSetting; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."EvoaiSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "evoaiIdFallback" character varying(100),
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."EvoaiSetting" OWNER TO bravapos_user;

--
-- Name: EvolutionBot; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."EvolutionBot" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    description character varying(255),
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" evolution."TriggerType",
    "triggerOperator" evolution."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution."EvolutionBot" OWNER TO bravapos_user;

--
-- Name: EvolutionBotSetting; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."EvolutionBotSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "botIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution."EvolutionBotSetting" OWNER TO bravapos_user;

--
-- Name: Flowise; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Flowise" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    description character varying(255),
    "apiUrl" character varying(255),
    "apiKey" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" evolution."TriggerType",
    "triggerOperator" evolution."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution."Flowise" OWNER TO bravapos_user;

--
-- Name: FlowiseSetting; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."FlowiseSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "flowiseIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution."FlowiseSetting" OWNER TO bravapos_user;

--
-- Name: Instance; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Instance" (
    id text NOT NULL,
    name character varying(255) NOT NULL,
    "connectionStatus" evolution."InstanceConnectionStatus" DEFAULT 'open'::evolution."InstanceConnectionStatus" NOT NULL,
    "ownerJid" character varying(100),
    "profilePicUrl" character varying(500),
    integration character varying(100),
    number character varying(100),
    token character varying(255),
    "clientName" character varying(100),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "profileName" character varying(100),
    "businessId" character varying(100),
    "disconnectionAt" timestamp without time zone,
    "disconnectionObject" jsonb,
    "disconnectionReasonCode" integer
);


ALTER TABLE evolution."Instance" OWNER TO bravapos_user;

--
-- Name: IntegrationSession; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."IntegrationSession" (
    id text NOT NULL,
    "sessionId" character varying(255) NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "pushName" text,
    status evolution."SessionStatus" NOT NULL,
    "awaitUser" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    parameters jsonb,
    context jsonb,
    "botId" text,
    type character varying(100)
);


ALTER TABLE evolution."IntegrationSession" OWNER TO bravapos_user;

--
-- Name: IsOnWhatsapp; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."IsOnWhatsapp" (
    id text NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "jidOptions" text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    lid character varying(100)
);


ALTER TABLE evolution."IsOnWhatsapp" OWNER TO bravapos_user;

--
-- Name: Kafka; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Kafka" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Kafka" OWNER TO bravapos_user;

--
-- Name: Label; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Label" (
    id text NOT NULL,
    "labelId" character varying(100),
    name character varying(100) NOT NULL,
    color character varying(100) NOT NULL,
    "predefinedId" character varying(100),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Label" OWNER TO bravapos_user;

--
-- Name: Media; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Media" (
    id text NOT NULL,
    "fileName" character varying(500) NOT NULL,
    type character varying(100) NOT NULL,
    mimetype character varying(100) NOT NULL,
    "createdAt" date DEFAULT CURRENT_TIMESTAMP,
    "messageId" text NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Media" OWNER TO bravapos_user;

--
-- Name: Message; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Message" (
    id text NOT NULL,
    key jsonb NOT NULL,
    "pushName" character varying(100),
    participant character varying(100),
    "messageType" character varying(100) NOT NULL,
    message jsonb NOT NULL,
    "contextInfo" jsonb,
    source evolution."DeviceMessage" NOT NULL,
    "messageTimestamp" integer NOT NULL,
    "chatwootMessageId" integer,
    "chatwootInboxId" integer,
    "chatwootConversationId" integer,
    "chatwootContactInboxSourceId" character varying(100),
    "chatwootIsRead" boolean,
    "instanceId" text NOT NULL,
    "webhookUrl" character varying(500),
    "sessionId" text,
    status character varying(30)
);


ALTER TABLE evolution."Message" OWNER TO bravapos_user;

--
-- Name: MessageUpdate; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."MessageUpdate" (
    id text NOT NULL,
    "keyId" character varying(100) NOT NULL,
    "remoteJid" character varying(100) NOT NULL,
    "fromMe" boolean NOT NULL,
    participant character varying(100),
    "pollUpdates" jsonb,
    status character varying(30) NOT NULL,
    "messageId" text NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."MessageUpdate" OWNER TO bravapos_user;

--
-- Name: N8n; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."N8n" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    description character varying(255),
    "webhookUrl" character varying(255),
    "basicAuthUser" character varying(255),
    "basicAuthPass" character varying(255),
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50,
    "triggerType" evolution."TriggerType",
    "triggerOperator" evolution."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."N8n" OWNER TO bravapos_user;

--
-- Name: N8nSetting; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."N8nSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "n8nIdFallback" character varying(100),
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."N8nSetting" OWNER TO bravapos_user;

--
-- Name: Nats; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Nats" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Nats" OWNER TO bravapos_user;

--
-- Name: OpenaiBot; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."OpenaiBot" (
    id text NOT NULL,
    "assistantId" character varying(255),
    model character varying(100),
    "systemMessages" jsonb,
    "assistantMessages" jsonb,
    "userMessages" jsonb,
    "maxTokens" integer,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "triggerType" evolution."TriggerType",
    "triggerOperator" evolution."TriggerOperator",
    "triggerValue" text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "openaiCredsId" text NOT NULL,
    "instanceId" text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "botType" evolution."OpenaiBotType" NOT NULL,
    description character varying(255),
    "functionUrl" character varying(500),
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution."OpenaiBot" OWNER TO bravapos_user;

--
-- Name: OpenaiCreds; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."OpenaiCreds" (
    id text NOT NULL,
    "apiKey" character varying(255),
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    name character varying(255)
);


ALTER TABLE evolution."OpenaiCreds" OWNER TO bravapos_user;

--
-- Name: OpenaiSetting; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."OpenaiSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "openaiCredsId" text NOT NULL,
    "openaiIdFallback" character varying(100),
    "instanceId" text NOT NULL,
    "speechToText" boolean DEFAULT false,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution."OpenaiSetting" OWNER TO bravapos_user;

--
-- Name: Proxy; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Proxy" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    host character varying(100) NOT NULL,
    port character varying(100) NOT NULL,
    protocol character varying(100) NOT NULL,
    username character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Proxy" OWNER TO bravapos_user;

--
-- Name: Pusher; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Pusher" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    "appId" character varying(100) NOT NULL,
    key character varying(100) NOT NULL,
    secret character varying(100) NOT NULL,
    cluster character varying(100) NOT NULL,
    "useTLS" boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Pusher" OWNER TO bravapos_user;

--
-- Name: Rabbitmq; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Rabbitmq" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Rabbitmq" OWNER TO bravapos_user;

--
-- Name: Session; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Session" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    creds text,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE evolution."Session" OWNER TO bravapos_user;

--
-- Name: Setting; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Setting" (
    id text NOT NULL,
    "rejectCall" boolean DEFAULT false NOT NULL,
    "msgCall" character varying(100),
    "groupsIgnore" boolean DEFAULT false NOT NULL,
    "alwaysOnline" boolean DEFAULT false NOT NULL,
    "readMessages" boolean DEFAULT false NOT NULL,
    "readStatus" boolean DEFAULT false NOT NULL,
    "syncFullHistory" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "wavoipToken" character varying(100)
);


ALTER TABLE evolution."Setting" OWNER TO bravapos_user;

--
-- Name: Sqs; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Sqs" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Sqs" OWNER TO bravapos_user;

--
-- Name: Template; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Template" (
    id text NOT NULL,
    "templateId" character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    template jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "webhookUrl" character varying(500)
);


ALTER TABLE evolution."Template" OWNER TO bravapos_user;

--
-- Name: Typebot; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Typebot" (
    id text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    url character varying(500) NOT NULL,
    typebot character varying(100) NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone,
    "triggerType" evolution."TriggerType",
    "triggerOperator" evolution."TriggerOperator",
    "triggerValue" text,
    "instanceId" text NOT NULL,
    "debounceTime" integer,
    "ignoreJids" jsonb,
    description character varying(255),
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution."Typebot" OWNER TO bravapos_user;

--
-- Name: TypebotSetting; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."TypebotSetting" (
    id text NOT NULL,
    expire integer DEFAULT 0,
    "keywordFinish" character varying(100),
    "delayMessage" integer,
    "unknownMessage" character varying(100),
    "listeningFromMe" boolean DEFAULT false,
    "stopBotFromMe" boolean DEFAULT false,
    "keepOpen" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    "debounceTime" integer,
    "typebotIdFallback" character varying(100),
    "ignoreJids" jsonb,
    "splitMessages" boolean DEFAULT false,
    "timePerChar" integer DEFAULT 50
);


ALTER TABLE evolution."TypebotSetting" OWNER TO bravapos_user;

--
-- Name: Webhook; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Webhook" (
    id text NOT NULL,
    url character varying(500) NOT NULL,
    enabled boolean DEFAULT true,
    events jsonb,
    "webhookByEvents" boolean DEFAULT false,
    "webhookBase64" boolean DEFAULT false,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL,
    headers jsonb
);


ALTER TABLE evolution."Webhook" OWNER TO bravapos_user;

--
-- Name: Websocket; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution."Websocket" (
    id text NOT NULL,
    enabled boolean DEFAULT false NOT NULL,
    events jsonb NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone NOT NULL,
    "instanceId" text NOT NULL
);


ALTER TABLE evolution."Websocket" OWNER TO bravapos_user;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: evolution; Owner: bravapos_user
--

CREATE TABLE evolution._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE evolution._prisma_migrations OWNER TO bravapos_user;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO bravapos_user;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO bravapos_user;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO bravapos_user;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO bravapos_user;

--
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO bravapos_user;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO bravapos_user;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: authtoken_token; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.authtoken_token (
    key character varying(40) NOT NULL,
    created timestamp with time zone NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.authtoken_token OWNER TO bravapos_user;

--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO bravapos_user;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO bravapos_user;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO bravapos_user;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO bravapos_user;

--
-- Name: negocios_categoria; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_categoria (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    orden integer NOT NULL,
    activo boolean NOT NULL,
    negocio_id bigint NOT NULL
);


ALTER TABLE public.negocios_categoria OWNER TO bravapos_user;

--
-- Name: negocios_categoria_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_categoria ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_categoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_cliente; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_cliente (
    id bigint NOT NULL,
    telefono character varying(20) NOT NULL,
    nombre character varying(100),
    email character varying(254),
    puntos_acumulados integer NOT NULL,
    total_gastado numeric(10,2) NOT NULL,
    cantidad_pedidos integer NOT NULL,
    ultima_compra timestamp with time zone,
    tags jsonb NOT NULL,
    negocio_id bigint NOT NULL,
    fecha_nacimiento date,
    bot_estado character varying(50) NOT NULL,
    bot_memoria jsonb NOT NULL
);


ALTER TABLE public.negocios_cliente OWNER TO bravapos_user;

--
-- Name: negocios_cliente_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_cliente ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_cliente_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_combopromocional; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_combopromocional (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    precio numeric(10,2) NOT NULL,
    imagen character varying(100),
    rangos_fechas jsonb NOT NULL,
    activo boolean NOT NULL,
    creado_en timestamp with time zone NOT NULL,
    negocio_id bigint NOT NULL,
    sede_id bigint
);


ALTER TABLE public.negocios_combopromocional OWNER TO bravapos_user;

--
-- Name: negocios_combopromocional_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_combopromocional ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_combopromocional_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_componentecombo; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_componentecombo (
    id bigint NOT NULL,
    cantidad integer NOT NULL,
    combo_id bigint NOT NULL,
    producto_hijo_id bigint NOT NULL,
    opcion_seleccionada_id bigint,
    variacion_seleccionada_id bigint,
    CONSTRAINT negocios_componentecombo_cantidad_check CHECK ((cantidad >= 0))
);


ALTER TABLE public.negocios_componentecombo OWNER TO bravapos_user;

--
-- Name: negocios_componentecombo_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_componentecombo ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_componentecombo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_cuponpromocional; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_cuponpromocional (
    id bigint NOT NULL,
    codigo character varying(20) NOT NULL,
    descripcion text NOT NULL,
    monto_descuento numeric(10,2) NOT NULL,
    es_porcentaje boolean NOT NULL,
    limite_usos integer NOT NULL,
    fecha_expiracion timestamp with time zone NOT NULL,
    activo boolean NOT NULL,
    negocio_id bigint NOT NULL
);


ALTER TABLE public.negocios_cuponpromocional OWNER TO bravapos_user;

--
-- Name: negocios_cuponpromocional_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_cuponpromocional ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_cuponpromocional_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_detalleorden; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_detalleorden (
    id bigint NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    notas_y_modificadores jsonb NOT NULL,
    orden_id bigint NOT NULL,
    producto_id bigint NOT NULL,
    notas_cocina text,
    activo boolean NOT NULL
);


ALTER TABLE public.negocios_detalleorden OWNER TO bravapos_user;

--
-- Name: negocios_detalleorden_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_detalleorden ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_detalleorden_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_detalleordenopcion; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_detalleordenopcion (
    id bigint NOT NULL,
    precio_adicional_aplicado numeric(10,2) NOT NULL,
    detalle_orden_id bigint NOT NULL,
    opcion_variacion_id bigint NOT NULL
);


ALTER TABLE public.negocios_detalleordenopcion OWNER TO bravapos_user;

--
-- Name: negocios_detalleordenopcion_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_detalleordenopcion ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_detalleordenopcion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_empleado; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_empleado (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    pin character varying(128) NOT NULL,
    activo boolean NOT NULL,
    ultimo_ingreso timestamp with time zone,
    rol_id bigint,
    negocio_id bigint,
    sede_id bigint
);


ALTER TABLE public.negocios_empleado OWNER TO bravapos_user;

--
-- Name: negocios_empleado_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_empleado ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_empleado_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_grupovariacion; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_grupovariacion (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    obligatorio boolean NOT NULL,
    seleccion_multiple boolean NOT NULL,
    producto_id bigint NOT NULL
);


ALTER TABLE public.negocios_grupovariacion OWNER TO bravapos_user;

--
-- Name: negocios_grupovariacion_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_grupovariacion ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_grupovariacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_horariovisibilidad; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_horariovisibilidad (
    id bigint NOT NULL,
    dias_permitidos jsonb NOT NULL,
    hora_inicio time without time zone,
    hora_fin time without time zone,
    producto_id bigint,
    activa boolean NOT NULL,
    categoria_id bigint,
    precio_especial numeric(10,2),
    tipo_promo character varying(20) NOT NULL,
    rangos_fechas jsonb NOT NULL,
    compra_x integer NOT NULL,
    creado_en timestamp with time zone NOT NULL,
    lleva_y integer NOT NULL,
    negocio_id bigint,
    nombre character varying(100) NOT NULL,
    porcentaje_descuento numeric(5,2),
    se_repite_semanalmente boolean NOT NULL,
    opcion_variacion_id bigint,
    sede_id bigint,
    CONSTRAINT negocios_horariovisibilidad_compra_x_check CHECK ((compra_x >= 0)),
    CONSTRAINT negocios_horariovisibilidad_lleva_y_check CHECK ((lleva_y >= 0))
);


ALTER TABLE public.negocios_horariovisibilidad OWNER TO bravapos_user;

--
-- Name: negocios_horariovisibilidad_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_horariovisibilidad ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_horariovisibilidad_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_insumobase; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_insumobase (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    unidad_medida character varying(20) NOT NULL,
    imagen character varying(100),
    activo boolean NOT NULL,
    negocio_id bigint NOT NULL,
    stock_general numeric(10,3) NOT NULL
);


ALTER TABLE public.negocios_insumobase OWNER TO bravapos_user;

--
-- Name: negocios_insumobase_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_insumobase ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_insumobase_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_insumosede; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_insumosede (
    id bigint NOT NULL,
    stock_actual numeric(10,3) NOT NULL,
    stock_minimo numeric(10,3) NOT NULL,
    costo_unitario numeric(10,2) NOT NULL,
    insumo_base_id bigint NOT NULL,
    sede_id bigint NOT NULL
);


ALTER TABLE public.negocios_insumosede OWNER TO bravapos_user;

--
-- Name: negocios_insumosede_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_insumosede ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_insumosede_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_itemcombopromocional; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_itemcombopromocional (
    id bigint NOT NULL,
    cantidad integer NOT NULL,
    combo_id bigint NOT NULL,
    opcion_seleccionada_id bigint,
    producto_id bigint NOT NULL,
    variacion_seleccionada_id bigint,
    CONSTRAINT negocios_itemcombopromocional_cantidad_check CHECK ((cantidad >= 0))
);


ALTER TABLE public.negocios_itemcombopromocional OWNER TO bravapos_user;

--
-- Name: negocios_itemcombopromocional_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_itemcombopromocional ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_itemcombopromocional_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_mesa; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_mesa (
    id bigint NOT NULL,
    numero_o_nombre character varying(20) NOT NULL,
    capacidad integer NOT NULL,
    mesa_principal_id bigint,
    sede_id bigint NOT NULL,
    activo boolean NOT NULL,
    forma character varying(20) NOT NULL,
    posicion_x integer NOT NULL,
    posicion_y integer NOT NULL
);


ALTER TABLE public.negocios_mesa OWNER TO bravapos_user;

--
-- Name: negocios_mesa_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_mesa ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_mesa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_modificadorrapido; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_modificadorrapido (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    negocio_id bigint NOT NULL,
    precio numeric(6,2) NOT NULL
);


ALTER TABLE public.negocios_modificadorrapido OWNER TO bravapos_user;

--
-- Name: negocios_modificadorrapido_categorias_aplicables; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_modificadorrapido_categorias_aplicables (
    id bigint NOT NULL,
    modificadorrapido_id bigint NOT NULL,
    categoria_id bigint NOT NULL
);


ALTER TABLE public.negocios_modificadorrapido_categorias_aplicables OWNER TO bravapos_user;

--
-- Name: negocios_modificadorrapido_categorias_aplicables_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_modificadorrapido_categorias_aplicables ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_modificadorrapido_categorias_aplicables_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_modificadorrapido_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_modificadorrapido ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_modificadorrapido_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_movimientocaja; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_movimientocaja (
    id bigint NOT NULL,
    tipo character varying(10) NOT NULL,
    monto numeric(10,2) NOT NULL,
    concepto character varying(255) NOT NULL,
    fecha timestamp with time zone NOT NULL,
    empleado_id bigint NOT NULL,
    sede_id bigint NOT NULL,
    sesion_caja_id bigint NOT NULL
);


ALTER TABLE public.negocios_movimientocaja OWNER TO bravapos_user;

--
-- Name: negocios_movimientocaja_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_movimientocaja ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_movimientocaja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_negocio; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_negocio (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    fecha_registro timestamp with time zone NOT NULL,
    fin_prueba timestamp with time zone NOT NULL,
    activo boolean NOT NULL,
    mod_cocina_activo boolean NOT NULL,
    mod_inventario_activo boolean NOT NULL,
    propietario_id integer NOT NULL,
    mod_delivery_activo boolean NOT NULL,
    yape_numero character varying(15),
    color_primario character varying(7) NOT NULL,
    mod_clientes_activo boolean NOT NULL,
    mod_facturacion_activo boolean NOT NULL,
    mod_salon_activo boolean NOT NULL,
    tema_fondo character varying(10) NOT NULL,
    mod_bot_wsp_activo boolean NOT NULL,
    mod_carta_qr_activo boolean NOT NULL,
    mod_ml_activo boolean NOT NULL,
    plan_id bigint,
    culqi_private_key character varying(255),
    culqi_public_key character varying(255),
    logo character varying(100),
    plin_numero character varying(15),
    plin_qr character varying(100),
    razon_social character varying(255),
    ruc character varying(11),
    usa_culqi boolean NOT NULL,
    yape_qr character varying(100),
    carta_config jsonb NOT NULL
);


ALTER TABLE public.negocios_negocio OWNER TO bravapos_user;

--
-- Name: negocios_negocio_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_negocio ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_negocio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_opcionvariacion; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_opcionvariacion (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    precio_adicional numeric(10,2) NOT NULL,
    grupo_id bigint NOT NULL
);


ALTER TABLE public.negocios_opcionvariacion OWNER TO bravapos_user;

--
-- Name: negocios_opcionvariacion_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_opcionvariacion ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_opcionvariacion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_orden; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_orden (
    id bigint NOT NULL,
    tipo character varying(20) NOT NULL,
    estado character varying(20) NOT NULL,
    total numeric(10,2) NOT NULL,
    creado_en timestamp with time zone NOT NULL,
    mesa_id bigint,
    sede_id bigint NOT NULL,
    cliente_nombre character varying(100),
    cliente_telefono character varying(20),
    motivo_cancelacion character varying(255),
    estado_pago character varying(20) NOT NULL,
    mesero_id bigint,
    sesion_caja_id bigint,
    costo_envio numeric(6,2) NOT NULL,
    direccion_entrega character varying(255),
    latitud numeric(10,7),
    longitud numeric(10,7),
    metodo_pago_esperado character varying(50),
    pago_validado_bot boolean NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    descuento_total numeric(10,2) NOT NULL,
    recargo_total numeric(10,2) NOT NULL
);


ALTER TABLE public.negocios_orden OWNER TO bravapos_user;

--
-- Name: negocios_orden_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_orden ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_orden_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_pago; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_pago (
    id bigint NOT NULL,
    metodo character varying(20) NOT NULL,
    monto numeric(10,2) NOT NULL,
    fecha_pago timestamp with time zone NOT NULL,
    orden_id bigint NOT NULL,
    sesion_caja_id bigint
);


ALTER TABLE public.negocios_pago OWNER TO bravapos_user;

--
-- Name: negocios_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_pago ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_pago_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_plansaas; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_plansaas (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    precio_mensual numeric(8,2) NOT NULL,
    modulo_kds boolean NOT NULL,
    modulo_inventario boolean NOT NULL,
    modulo_delivery boolean NOT NULL,
    max_sedes integer NOT NULL,
    modulo_bot_wsp boolean NOT NULL,
    modulo_carta_qr boolean NOT NULL,
    modulo_ml boolean NOT NULL
);


ALTER TABLE public.negocios_plansaas OWNER TO bravapos_user;

--
-- Name: negocios_plansaas_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_plansaas ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_plansaas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_producto; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_producto (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    precio_base numeric(10,2) NOT NULL,
    disponible boolean NOT NULL,
    tiene_variaciones boolean NOT NULL,
    negocio_id bigint NOT NULL,
    es_venta_rapida boolean NOT NULL,
    requiere_seleccion boolean NOT NULL,
    activo boolean NOT NULL,
    categoria_id bigint,
    destacar_como_promocion boolean NOT NULL,
    es_combo boolean NOT NULL,
    imagen character varying(100)
);


ALTER TABLE public.negocios_producto OWNER TO bravapos_user;

--
-- Name: negocios_producto_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_producto ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_producto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_promocionbot; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_promocionbot (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(50) NOT NULL,
    mensaje_gancho text NOT NULL,
    activa boolean NOT NULL,
    cupon_id bigint,
    sede_id bigint NOT NULL
);


ALTER TABLE public.negocios_promocionbot OWNER TO bravapos_user;

--
-- Name: negocios_promocionbot_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_promocionbot ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_promocionbot_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_recetadetalle; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_recetadetalle (
    id bigint NOT NULL,
    cantidad_necesaria numeric(10,3) NOT NULL,
    insumo_id bigint NOT NULL,
    producto_id bigint NOT NULL
);


ALTER TABLE public.negocios_recetadetalle OWNER TO bravapos_user;

--
-- Name: negocios_recetadetalle_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_recetadetalle ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_recetadetalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_recetaopcion; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_recetaopcion (
    id bigint NOT NULL,
    cantidad_necesaria numeric(10,3) NOT NULL,
    insumo_id bigint NOT NULL,
    opcion_id bigint NOT NULL
);


ALTER TABLE public.negocios_recetaopcion OWNER TO bravapos_user;

--
-- Name: negocios_recetaopcion_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_recetaopcion ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_recetaopcion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_registroauditoria; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_registroauditoria (
    id bigint NOT NULL,
    empleado_nombre character varying(100) NOT NULL,
    accion character varying(50) NOT NULL,
    descripcion text NOT NULL,
    fecha timestamp with time zone NOT NULL,
    empleado_id bigint,
    orden_id bigint,
    sede_id bigint NOT NULL
);


ALTER TABLE public.negocios_registroauditoria OWNER TO bravapos_user;

--
-- Name: negocios_registroauditoria_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_registroauditoria ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_registroauditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_reglabot; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_reglabot (
    id bigint NOT NULL,
    trigger character varying(50) NOT NULL,
    mensaje text NOT NULL,
    activa boolean NOT NULL,
    sede_id bigint NOT NULL
);


ALTER TABLE public.negocios_reglabot OWNER TO bravapos_user;

--
-- Name: negocios_reglabot_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_reglabot ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_reglabot_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_reglanegocio; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_reglanegocio (
    id bigint NOT NULL,
    tipo character varying(30) NOT NULL,
    valor numeric(10,2) NOT NULL,
    es_porcentaje boolean NOT NULL,
    monto_minimo_orden numeric(10,2) NOT NULL,
    dia_semana integer,
    activa boolean NOT NULL,
    negocio_id bigint NOT NULL,
    accion_aplica_a character varying(30) NOT NULL,
    accion_categoria_id bigint,
    accion_es_descuento boolean NOT NULL,
    accion_producto_id bigint,
    condicion_hora_fin time without time zone,
    condicion_hora_inicio time without time zone,
    condicion_metodo_pago character varying(30) NOT NULL,
    condicion_tipo_orden character varying(30) NOT NULL,
    nombre character varying(100) NOT NULL
);


ALTER TABLE public.negocios_reglanegocio OWNER TO bravapos_user;

--
-- Name: negocios_reglanegocio_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_reglanegocio ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_reglanegocio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_rol; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_rol (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    puede_cobrar boolean NOT NULL,
    puede_configurar boolean NOT NULL
);


ALTER TABLE public.negocios_rol OWNER TO bravapos_user;

--
-- Name: negocios_rol_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_rol ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_rol_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_sede; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_sede (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    direccion character varying(200),
    negocio_id bigint NOT NULL,
    activo boolean NOT NULL,
    columnas_salon integer NOT NULL,
    whatsapp_instancia character varying(50),
    whatsapp_numero character varying(20),
    latitud double precision,
    longitud double precision,
    carta_pdf character varying(100),
    enlace_carta_virtual character varying(500),
    dias_atencion jsonb NOT NULL,
    hora_apertura time without time zone,
    hora_cierre time without time zone,
    bot_cumple_activo boolean NOT NULL,
    bot_puntos_activos boolean NOT NULL,
    bot_max_pedidos_pendientes integer NOT NULL,
    bot_cumple_minimo numeric(10,2),
    bot_cumple_tipo character varying(20) NOT NULL,
    bot_cumple_valor numeric(10,2)
);


ALTER TABLE public.negocios_sede OWNER TO bravapos_user;

--
-- Name: negocios_sede_bot_cumple_productos; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_sede_bot_cumple_productos (
    id bigint NOT NULL,
    sede_id bigint NOT NULL,
    producto_id bigint NOT NULL
);


ALTER TABLE public.negocios_sede_bot_cumple_productos OWNER TO bravapos_user;

--
-- Name: negocios_sede_bot_cumple_productos_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_sede_bot_cumple_productos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_sede_bot_cumple_productos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_sede_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_sede ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_sede_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_sesioncaja; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_sesioncaja (
    id bigint NOT NULL,
    hora_apertura timestamp with time zone NOT NULL,
    fondo_inicial numeric(10,2) NOT NULL,
    estado character varying(20) NOT NULL,
    empleado_abre_id bigint,
    empleado_cierra_id bigint,
    hora_cierre timestamp with time zone,
    sede_id bigint,
    ventas_digitales numeric(10,2) NOT NULL,
    ventas_efectivo numeric(10,2) NOT NULL,
    declarado_efectivo numeric(10,2) NOT NULL,
    declarado_tarjeta numeric(10,2) NOT NULL,
    declarado_yape numeric(10,2) NOT NULL,
    diferencia numeric(10,2) NOT NULL,
    esperado_digital numeric(10,2) NOT NULL,
    esperado_efectivo numeric(10,2) NOT NULL
);


ALTER TABLE public.negocios_sesioncaja OWNER TO bravapos_user;

--
-- Name: negocios_sesioncaja_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_sesioncaja ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_sesioncaja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_solicitudcambio; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_solicitudcambio (
    id bigint NOT NULL,
    tipo_accion character varying(20) NOT NULL,
    detalles_json jsonb NOT NULL,
    estado character varying(20) NOT NULL,
    creado_en timestamp with time zone NOT NULL,
    orden_id bigint NOT NULL
);


ALTER TABLE public.negocios_solicitudcambio OWNER TO bravapos_user;

--
-- Name: negocios_solicitudcambio_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_solicitudcambio ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_solicitudcambio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_suscripcion; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_suscripcion (
    id bigint NOT NULL,
    fecha_inicio timestamp with time zone NOT NULL,
    fecha_fin timestamp with time zone NOT NULL,
    activa boolean NOT NULL,
    negocio_id bigint NOT NULL,
    plan_id bigint NOT NULL
);


ALTER TABLE public.negocios_suscripcion OWNER TO bravapos_user;

--
-- Name: negocios_suscripcion_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_suscripcion ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_suscripcion_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_variacionproducto; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_variacionproducto (
    id bigint NOT NULL,
    nombre character varying(50) NOT NULL,
    precio numeric(10,2) NOT NULL,
    producto_id bigint NOT NULL
);


ALTER TABLE public.negocios_variacionproducto OWNER TO bravapos_user;

--
-- Name: negocios_variacionproducto_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_variacionproducto ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_variacionproducto_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: negocios_zonadelivery; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.negocios_zonadelivery (
    id bigint NOT NULL,
    nombre character varying(100) NOT NULL,
    costo_envio numeric(6,2) NOT NULL,
    pedido_minimo numeric(6,2) NOT NULL,
    activa boolean NOT NULL,
    sede_id bigint NOT NULL,
    radio_max_km double precision NOT NULL
);


ALTER TABLE public.negocios_zonadelivery OWNER TO bravapos_user;

--
-- Name: negocios_zonadelivery_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.negocios_zonadelivery ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.negocios_zonadelivery_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: token_blacklist_blacklistedtoken; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.token_blacklist_blacklistedtoken (
    id bigint NOT NULL,
    blacklisted_at timestamp with time zone NOT NULL,
    token_id bigint NOT NULL
);


ALTER TABLE public.token_blacklist_blacklistedtoken OWNER TO bravapos_user;

--
-- Name: token_blacklist_blacklistedtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.token_blacklist_blacklistedtoken ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.token_blacklist_blacklistedtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: token_blacklist_outstandingtoken; Type: TABLE; Schema: public; Owner: bravapos_user
--

CREATE TABLE public.token_blacklist_outstandingtoken (
    id bigint NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    user_id integer,
    jti character varying(255) NOT NULL
);


ALTER TABLE public.token_blacklist_outstandingtoken OWNER TO bravapos_user;

--
-- Name: token_blacklist_outstandingtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: bravapos_user
--

ALTER TABLE public.token_blacklist_outstandingtoken ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.token_blacklist_outstandingtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: Chat; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Chat" (id, "remoteJid", labels, "createdAt", "updatedAt", "instanceId", name, "unreadMessages") FROM stdin;
\.


--
-- Data for Name: Chatwoot; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Chatwoot" (id, enabled, "accountId", token, url, "nameInbox", "signMsg", "signDelimiter", number, "reopenConversation", "conversationPending", "mergeBrazilContacts", "importContacts", "importMessages", "daysLimitImportMessages", "createdAt", "updatedAt", "instanceId", logo, organization, "ignoreJids") FROM stdin;
\.


--
-- Data for Name: Contact; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Contact" (id, "remoteJid", "pushName", "profilePicUrl", "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Dify; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Dify" (id, enabled, "botType", "apiUrl", "apiKey", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId", description, "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: DifySetting; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."DifySetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "difyIdFallback", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Evoai; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Evoai" (id, enabled, description, "agentUrl", "apiKey", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "splitMessages", "timePerChar", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: EvoaiSetting; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."EvoaiSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "splitMessages", "timePerChar", "createdAt", "updatedAt", "evoaiIdFallback", "instanceId") FROM stdin;
\.


--
-- Data for Name: EvolutionBot; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."EvolutionBot" (id, enabled, description, "apiUrl", "apiKey", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: EvolutionBotSetting; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."EvolutionBotSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "botIdFallback", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Flowise; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Flowise" (id, enabled, description, "apiUrl", "apiKey", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: FlowiseSetting; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."FlowiseSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "flowiseIdFallback", "instanceId", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Instance; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Instance" (id, name, "connectionStatus", "ownerJid", "profilePicUrl", integration, number, token, "clientName", "createdAt", "updatedAt", "profileName", "businessId", "disconnectionAt", "disconnectionObject", "disconnectionReasonCode") FROM stdin;
\.


--
-- Data for Name: IntegrationSession; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."IntegrationSession" (id, "sessionId", "remoteJid", "pushName", status, "awaitUser", "createdAt", "updatedAt", "instanceId", parameters, context, "botId", type) FROM stdin;
\.


--
-- Data for Name: IsOnWhatsapp; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."IsOnWhatsapp" (id, "remoteJid", "jidOptions", "createdAt", "updatedAt", lid) FROM stdin;
\.


--
-- Data for Name: Kafka; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Kafka" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Label; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Label" (id, "labelId", name, color, "predefinedId", "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Media; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Media" (id, "fileName", type, mimetype, "createdAt", "messageId", "instanceId") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Message" (id, key, "pushName", participant, "messageType", message, "contextInfo", source, "messageTimestamp", "chatwootMessageId", "chatwootInboxId", "chatwootConversationId", "chatwootContactInboxSourceId", "chatwootIsRead", "instanceId", "webhookUrl", "sessionId", status) FROM stdin;
\.


--
-- Data for Name: MessageUpdate; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."MessageUpdate" (id, "keyId", "remoteJid", "fromMe", participant, "pollUpdates", status, "messageId", "instanceId") FROM stdin;
\.


--
-- Data for Name: N8n; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."N8n" (id, enabled, description, "webhookUrl", "basicAuthUser", "basicAuthPass", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "splitMessages", "timePerChar", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: N8nSetting; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."N8nSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "splitMessages", "timePerChar", "createdAt", "updatedAt", "n8nIdFallback", "instanceId") FROM stdin;
\.


--
-- Data for Name: Nats; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Nats" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: OpenaiBot; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."OpenaiBot" (id, "assistantId", model, "systemMessages", "assistantMessages", "userMessages", "maxTokens", expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "triggerType", "triggerOperator", "triggerValue", "createdAt", "updatedAt", "openaiCredsId", "instanceId", enabled, "botType", description, "functionUrl", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: OpenaiCreds; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."OpenaiCreds" (id, "apiKey", "createdAt", "updatedAt", "instanceId", name) FROM stdin;
\.


--
-- Data for Name: OpenaiSetting; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."OpenaiSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "debounceTime", "ignoreJids", "createdAt", "updatedAt", "openaiCredsId", "openaiIdFallback", "instanceId", "speechToText", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Proxy; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Proxy" (id, enabled, host, port, protocol, username, password, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Pusher; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Pusher" (id, enabled, "appId", key, secret, cluster, "useTLS", events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Rabbitmq; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Rabbitmq" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Session" (id, "sessionId", creds, "createdAt") FROM stdin;
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Setting" (id, "rejectCall", "msgCall", "groupsIgnore", "alwaysOnline", "readMessages", "readStatus", "syncFullHistory", "createdAt", "updatedAt", "instanceId", "wavoipToken") FROM stdin;
\.


--
-- Data for Name: Sqs; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Sqs" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: Template; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Template" (id, "templateId", name, template, "createdAt", "updatedAt", "instanceId", "webhookUrl") FROM stdin;
\.


--
-- Data for Name: Typebot; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Typebot" (id, enabled, url, typebot, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "createdAt", "updatedAt", "triggerType", "triggerOperator", "triggerValue", "instanceId", "debounceTime", "ignoreJids", description, "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: TypebotSetting; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."TypebotSetting" (id, expire, "keywordFinish", "delayMessage", "unknownMessage", "listeningFromMe", "stopBotFromMe", "keepOpen", "createdAt", "updatedAt", "instanceId", "debounceTime", "typebotIdFallback", "ignoreJids", "splitMessages", "timePerChar") FROM stdin;
\.


--
-- Data for Name: Webhook; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Webhook" (id, url, enabled, events, "webhookByEvents", "webhookBase64", "createdAt", "updatedAt", "instanceId", headers) FROM stdin;
\.


--
-- Data for Name: Websocket; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution."Websocket" (id, enabled, events, "createdAt", "updatedAt", "instanceId") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: evolution; Owner: bravapos_user
--

COPY evolution._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
6c0b79de-6392-4bad-9606-858504fcad3f	1af30cbbccd90152fbb1b99a458978e42428a792b822b4b5f9c9c7fffbf7264f	2026-05-10 21:07:08.672765+00	20240819154941_add_context_to_integration_session	\N	\N	2026-05-10 21:07:08.670204+00	1
5b84d269-27f4-42d5-a4ef-60510588f303	7507eff6b49fad53cdd0b3ace500f529597dfa1a8987afbb9807968a8ee8ef49	2026-05-10 21:07:08.408785+00	20240609181238_init	\N	\N	2026-05-10 21:07:08.281494+00	1
96d5a425-785b-4d04-884b-a6ade40231a1	8c2a595975dc2f6dee831983304996e25c37014c48291576e7c8044078bfde32	2026-05-10 21:07:08.523636+00	20240722173259_add_name_column_to_openai_creds	\N	\N	2026-05-10 21:07:08.519439+00	1
655287ee-5875-49ba-b207-3a91a4637d52	914eeefb9eba0dacdbcb7cdbe47567abd957543d6f27c39db4eec6a40c864008	2026-05-10 21:07:08.413674+00	20240610144159_create_column_profile_name_instance	\N	\N	2026-05-10 21:07:08.409862+00	1
4ef10077-869e-4987-b33c-b22ae9203979	50d6920345af06dbd5086959784b7e2b4d163a5b555ff1029e5f81678a454444	2026-05-10 21:07:08.41766+00	20240611125754_create_columns_whitelabel_chatwoot	\N	\N	2026-05-10 21:07:08.414527+00	1
c8d7c2b2-a0f6-4c77-8ade-d41094e6f3f5	c29ccc88930138c50091712466f3f97bff48f6a0f486dcec5b19dc08c3612973	2026-05-10 21:07:08.580013+00	20240729180347_modify_typebot_session_status_openai_typebot_table	\N	\N	2026-05-10 21:07:08.564043+00	1
a55aae73-ce65-45e9-8f68-5e6810a7ee70	b90c49299ed812fb46b71a4f0b9f818b7fc7109c52b1aff227a107236839d93c	2026-05-10 21:07:08.421613+00	20240611202817_create_columns_debounce_time_typebot	\N	\N	2026-05-10 21:07:08.418432+00	1
3bf47dbb-5799-4f90-87a7-e882cec871a1	20b3c04d93799c25fa8b2d0a85d10f9280e915a5d7519542492ed85ff082a3c0	2026-05-10 21:07:08.527379+00	20240722173518_add_name_column_to_openai_creds	\N	\N	2026-05-10 21:07:08.524336+00	1
9fb35e94-5560-4a9d-b587-ff5e795001e0	01303057a037f5dc28272ac513b60d5a75be71d1bf727e671ca538db3268fa2e	2026-05-10 21:07:08.42518+00	20240712144948_add_business_id_column_to_instances	\N	\N	2026-05-10 21:07:08.422371+00	1
4999fc52-dcf6-4f7f-813b-d11017484909	34235c250eb1f088c285489ad690b4c045680f1638076436cdc66de0ea382cc2	2026-05-10 21:07:08.440054+00	20240712150256_create_templates_table	\N	\N	2026-05-10 21:07:08.426072+00	1
4a178bd3-97a5-4cef-b469-44c043e54d04	0ba192ba428c9ab5a9b31d1f7d73603ee47b6192e2f8c590f6d93ade0dbdbccf	2026-05-10 21:07:08.445461+00	20240712155950_adjusts_in_templates_table	\N	\N	2026-05-10 21:07:08.440892+00	1
90396f61-7b47-4b11-a823-1decf482cf3d	7ffb91b84cb7aa17b1f488d580626144cd557ccdfaec6654515545401d1938af	2026-05-10 21:07:08.533641+00	20240723152648_adjusts_in_column_openai_creds	\N	\N	2026-05-10 21:07:08.528113+00	1
6530a14a-de59-44a4-a492-c25850549266	426256b73f7ea52538dc91a890179c841325a9c387cf02885b81971d582af830	2026-05-10 21:07:08.452499+00	20240712162206_remove_templates_table	\N	\N	2026-05-10 21:07:08.446286+00	1
2aa47937-67e6-4c2c-8856-54f809ce823b	3496739609829e80daf733baecd3d3e4e279bf318a99adc1ca3aa1c76f893b2f	2026-05-10 21:07:08.458434+00	20240712223655_column_fallback_typebot	\N	\N	2026-05-10 21:07:08.453409+00	1
f05e59a0-b791-4252-9f48-06bf6364c1ea	c8627bad5d72ee4ef774ed32c95a2524517b0c60c49fa67cd4ba9dff7cbdde3b	2026-05-10 21:07:08.621566+00	20240811021156_add_chat_name_column	\N	\N	2026-05-10 21:07:08.618879+00	1
08f121ec-8648-4618-b9de-a10177fad5c9	bea48f697c0c5db52ade4a3f26c1321e3f5611c80ea50384baa54e58c6b3a79e	2026-05-10 21:07:08.461908+00	20240712230631_column_ignore_jids_typebot	\N	\N	2026-05-10 21:07:08.459217+00	1
8baf7bd6-5943-4b86-ada8-a14b9e7cf8c1	3056f8f1335e8933e4098f005e33cd4821190be2eb76520c0d01e2e13cf6e073	2026-05-10 21:07:08.54088+00	20240723200254_add_webhookurl_on_message	\N	\N	2026-05-10 21:07:08.534837+00	1
916ecb34-8e77-43f3-ae1e-9af74983859a	1bac56740af5d2d6512b29e7a6e0721d69b2a290400f6660b92b6f2d8b30cd6e	2026-05-10 21:07:08.475933+00	20240713184337_add_media_table	\N	\N	2026-05-10 21:07:08.462708+00	1
5e931302-d3ba-476e-acdc-32f8a9a9e1c9	bdd992b253321ca9a9556e30fea5e7760556cb8e80140aec34066301b55dc675	2026-05-10 21:07:08.514846+00	20240718121437_add_openai_tables	\N	\N	2026-05-10 21:07:08.477113+00	1
3184c2e2-a636-49f6-b002-2c5f5e0c048e	961a8627684fe1e4c7123565db3d16db30768df41881342032f9a2df16145eaf	2026-05-10 21:07:08.606572+00	20240730152156_create_dify_tables	\N	\N	2026-05-10 21:07:08.580889+00	1
70b624ca-c0ec-4ff8-a444-0abf980fecbb	8147ec0cc86ac30ea1be05d461559ba5064273a3fcb3227af71ddcd895f5aebe	2026-05-10 21:07:08.518737+00	20240718123923_adjusts_openai_tables	\N	\N	2026-05-10 21:07:08.515697+00	1
688f3eef-97de-4712-acba-e58448cb13ad	9d6c9b4ffe51483a851f6507f7aefd2fb34f54a7c28961856e3230fda4f87022	2026-05-10 21:07:08.552999+00	20240725184147_create_template_table	\N	\N	2026-05-10 21:07:08.54165+00	1
b7f4191e-2a6e-4b18-83f3-a80f6dfd5a8a	94e2edb21107895c77b24402f41cd020c7f74dbb39b9a95664a45e62e2582be9	2026-05-10 21:07:08.556368+00	20240725202651_add_webhook_url_template_table	\N	\N	2026-05-10 21:07:08.553701+00	1
b57a6b05-9c37-4939-b690-01aee8be4836	d0da588e4204c50bde2e41a615b9301afca072991033545b6f4e3e34e088db87	2026-05-10 21:07:08.560182+00	20240725221646_modify_token_instance_table	\N	\N	2026-05-10 21:07:08.557203+00	1
bde37ee4-6b1d-4aec-810b-0af8289b1fbe	b56b053451d564ff6282078fad4fc7bff4aa71e3b0b8d00bf219da4ed1bc4c86	2026-05-10 21:07:08.61061+00	20240801193907_add_column_speech_to_text_openai_setting_table	\N	\N	2026-05-10 21:07:08.607701+00	1
11dbd221-c925-4f7e-a8f6-14b0476820cb	a80f5c27cd80d088ea69153f8d6f4879406770ffa5a7fd50b28da82bd020322e	2026-05-10 21:07:08.563341+00	20240729115127_modify_trigger_type_openai_typebot_table	\N	\N	2026-05-10 21:07:08.560999+00	1
6b79e616-a8b8-4e85-ba0c-606aca010ff3	428a9148f2a29f773e0c9813149e6d07bf51765e018652aeac0be2141a722b67	2026-05-10 21:07:08.635877+00	20240814173033_add_ignore_jids_chatwoot	\N	\N	2026-05-10 21:07:08.633212+00	1
27240ac0-2d4f-4cf1-9b16-fd3f518c814f	2b963cbc826ea024f9a643af2d5d9fcea06717c90ec9bacb255d3836efa06aea	2026-05-10 21:07:08.614495+00	20240803163908_add_column_description_on_integrations_table	\N	\N	2026-05-10 21:07:08.61138+00	1
854ae51a-7c81-4fef-b4cf-7a1074b351b7	ee44f0420384d55de6d252fffb8f2cfa88479e5811e14cfe975d8edfcc6957e0	2026-05-10 21:07:08.627247+00	20240811183328_add_unique_index_for_remoted_jid_and_instance_in_contacts	\N	\N	2026-05-10 21:07:08.622322+00	1
a2e5bc59-1146-45c5-aec1-f73c440d7064	4d2dd947ebb7515c7c278472a10ebab6d5f41a5ef60e15df717a05d457d5d2aa	2026-05-10 21:07:08.618202+00	20240808210239_add_column_function_url_openaibot_table	\N	\N	2026-05-10 21:07:08.615249+00	1
4ef448c4-77fe-420e-81fb-b67d0f58ed08	29c330029a48aaee63567e63c4f4e57b7c1f5344162b11fbf61a4dc194547861	2026-05-10 21:07:08.632469+00	20240813003116_make_label_unique_for_instance	\N	\N	2026-05-10 21:07:08.627986+00	1
478d801e-ec6c-401f-9a10-1d7be45af17c	bc5cd1c7fb4df72e88cb4856c9c49ea340284c9d8f389fe558008a921494ed82	2026-05-10 21:07:08.669334+00	20240817110155_add_trigger_type_advanced	\N	\N	2026-05-10 21:07:08.66673+00	1
9d1bec4f-7bc1-469b-81b2-76f89704416a	e1eb8997ac99fd555b8a9241c817b97fa5614124922b4e6b3cb1751e9e2199c7	2026-05-10 21:07:08.665593+00	20240814202359_integrations_unification	\N	\N	2026-05-10 21:07:08.636692+00	1
ae0ce257-e08f-49a3-9b2b-712404e58b3c	a363a9ebc5bb526e504c4e6f71ed7702a5b6d317db6a9981f36c4560f9147fba	2026-05-10 21:07:08.679462+00	20240821120816_bot_id_integration_session	\N	\N	2026-05-10 21:07:08.673505+00	1
654c3c91-35cd-4bbc-942e-73031885d8a5	e31947e6c709ee3a62504980ae9ab1ffbfd9faf0cf9ac389cfd6435734c49902	2026-05-10 21:07:08.698657+00	20240821171327_add_generic_bot_table	\N	\N	2026-05-10 21:07:08.680206+00	1
40e920d4-3516-4979-88fb-67b7847417c7	18dde8e48c49a97f33f5b789ccd919326253c26d43af72c77f6b13d4285ffba8	2026-05-10 21:07:08.715222+00	20240821194524_add_flowise_table	\N	\N	2026-05-10 21:07:08.69951+00	1
bdde736e-7b60-4c7f-957c-e4e3c17c61fe	0148a09e0e5eedafe5c5169c6351201a5c70ebaa853456693d75a7b82a851dbe	2026-05-10 21:07:08.718595+00	20240824161333_add_type_on_integration_sessions	\N	\N	2026-05-10 21:07:08.716078+00	1
681f1163-9a5e-4136-a046-bcbb1b81a775	710e7ee3aabf07aa6ee9bf2865c09f75d461efa5724dd83f5a6f324ea1e5e47c	2026-05-10 21:07:08.745127+00	20240825130616_change_to_evolution_bot	\N	\N	2026-05-10 21:07:08.719362+00	1
650db9d0-f5b2-4440-a467-94d6c5c8ee4c	0a6034359b1cf68820e829d31402032eed0f77586fb1ee590a98f5a6c3e15847	2026-05-10 21:07:08.84414+00	20250514232744_add_n8n_table	\N	\N	2026-05-10 21:07:08.830212+00	1
a4f8c41c-cd34-4916-8d54-cb042e377811	d03a8a31df36eb0a07e80cd2a149b6d826e69bb2cb21fbe69943ae5ffba672ad	2026-05-10 21:07:08.753153+00	20240828140837_add_is_on_whatsapp_table	\N	\N	2026-05-10 21:07:08.745959+00	1
b0ae46b1-ffb9-4998-9506-4b8625d1340c	e927e00343b622bee7dab1b9b5c9fdd95007bfaf9d705ec52db9ecb05fb3d078	2026-05-10 21:07:08.756488+00	20240828141556_remove_name_column_from_on_whatsapp_table	\N	\N	2026-05-10 21:07:08.754061+00	1
d0e9886f-5d95-4e17-a038-5ae841a0300b	cf00d8ef2c28cf94aea51e7e2a80ddd65474a4f6c1113abc65dea6cc194c1a57	2026-05-10 21:07:08.767222+00	20240830193533_changed_table_case	\N	\N	2026-05-10 21:07:08.757215+00	1
fabebc49-a02d-4f54-bed6-81b36097cdce	f9ddf352b22e52a1f466d40df95da7bd6f4bf51310c07911d9c990f720e1fe81	2026-05-10 21:07:08.859054+00	20250515211815_add_evoai_table	\N	\N	2026-05-10 21:07:08.844992+00	1
63509cd6-b94c-4c3b-8a0c-f0c1aebc9d9e	1cc60b9c38db62b694f753e2ee4c155e95c66815b5800f6ddb6f7cddec23b1ad	2026-05-10 21:07:08.770479+00	20240906202019_add_headers_on_webhook_config	\N	\N	2026-05-10 21:07:08.767976+00	1
cba011c5-742e-4451-bb5f-57662b042816	7dff7227c1e013127210ab4f77b91dc24eae14bcd07f21fb27aaa2fa82b23865	2026-05-10 21:07:08.773487+00	20241001180457_add_message_status	\N	\N	2026-05-10 21:07:08.771148+00	1
4472562a-45f3-4735-86de-c6da51a9f765	07449acbac59175f82670f34664c1dcea4d34f9a1710f19bd3396e26868db09e	2026-05-10 21:07:08.781513+00	20241006130306_alter_status_on_message_table	\N	\N	2026-05-10 21:07:08.774092+00	1
a13e4fc0-2835-41a2-9ae8-0f8d4fc6792a	7a03627d41844a016b28b4194e36eea0e52cd24be0061535fecba4ccbd0e72f4	2026-05-10 21:07:08.862071+00	20250516012152_remove_unique_atribute_for_file_name_in_media	\N	\N	2026-05-10 21:07:08.859828+00	1
f159d5bd-19a1-4808-b1c2-5b841ea87130	7e9a7c45f05285e9fea38ccfa4266790a099107605299d81c309e689c06494ef	2026-05-10 21:07:08.784862+00	20241007164026_add_unread_messages_on_chat_table	\N	\N	2026-05-10 21:07:08.782261+00	1
bc44a32c-9d79-4e9a-ba9c-1f227aa1f6e4	7e3e4686eb8009cbf0f71e8606a442b1c2862673dbc654b3f36f39a36efcb586	2026-05-10 21:07:08.794056+00	20241011085129_create_pusher_table	\N	\N	2026-05-10 21:07:08.785578+00	1
ec3f0cf7-acf2-4541-b12e-afb3803f9857	270e1e51c7b9d24c0e68708ad167cb5748d591fd194ad422486574a0e83c0b79	2026-05-10 21:07:08.802765+00	20241011100803_split_messages_and_time_per_char_integrations	\N	\N	2026-05-10 21:07:08.794734+00	1
87465c53-13ca-4d1f-ab9d-93282b039682	3fca4961d4e7fa8e1a99e3ec6b072d235bec706b7463ab699887be1084e3b656	2026-05-10 21:07:08.866594+00	20250612155048_add_coluns_trypebot_tables	\N	\N	2026-05-10 21:07:08.862884+00	1
caaf200c-c0ee-4fc8-a974-44836a7891e0	e82282df963a32556a9c8cd5fd908dd5810d4c35f0d7765ab9e844ebad1106a2	2026-05-10 21:07:08.817942+00	20241017144950_create_index	\N	\N	2026-05-10 21:07:08.803458+00	1
3bf53320-2570-4d13-acbc-d50b7ffc31bd	668e44d3cd8caafa8f60f89805e9f80587c1c69b4d52a21dfc79f4b615125b1c	2026-05-10 21:07:08.820851+00	20250116001415_add_wavoip_token_to_settings_table	\N	\N	2026-05-10 21:07:08.8187+00	1
c8c89825-a3c4-4686-97a8-9ce43da9fdf4	17983175f27c61a0ee6aaa42c94d665cabb7e904ee91c33f867c657512210e1a	2026-05-10 21:07:08.829366+00	20250225180031_add_nats_integration	\N	\N	2026-05-10 21:07:08.821557+00	1
6f1b7609-dc46-437c-84fb-e9a76e3782a3	36a19fe7711b98d02b450aedb2de8802b5e2e635a1e530cbc42f1d184e89bec3	2026-05-10 21:07:08.869204+00	20250613143000_add_lid_column_to_is_onwhatsapp	\N	\N	2026-05-10 21:07:08.867186+00	1
28b98c13-6124-4144-aff1-714803a8c704	2b9d50b837a154ee3a74284c130b21fbe10ecddc1159cb29dac74c4ba4cb6a5f	2026-05-10 21:07:08.877997+00	20250918182355_add_kafka_integration	\N	\N	2026-05-10 21:07:08.869888+00	1
c15bf06a-5065-4f43-8e60-2e64bc932b3f	84053d218d69e85953f7533bbfced9171e762c02c88ab944aaaa75b17f18e161	2026-05-10 21:07:08.883174+00	20251122003044_add_chat_instance_remotejid_unique	\N	\N	2026-05-10 21:07:08.878704+00	1
\.


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add group	3	add_group
10	Can change group	3	change_group
11	Can delete group	3	delete_group
12	Can view group	3	view_group
13	Can add user	4	add_user
14	Can change user	4	change_user
15	Can delete user	4	delete_user
16	Can view user	4	view_user
17	Can add content type	5	add_contenttype
18	Can change content type	5	change_contenttype
19	Can delete content type	5	delete_contenttype
20	Can view content type	5	view_contenttype
21	Can add Blacklisted Token	6	add_blacklistedtoken
22	Can change Blacklisted Token	6	change_blacklistedtoken
23	Can delete Blacklisted Token	6	delete_blacklistedtoken
24	Can view Blacklisted Token	6	view_blacklistedtoken
25	Can add Outstanding Token	7	add_outstandingtoken
26	Can change Outstanding Token	7	change_outstandingtoken
27	Can delete Outstanding Token	7	delete_outstandingtoken
28	Can view Outstanding Token	7	view_outstandingtoken
29	Can add session	8	add_session
30	Can change session	8	change_session
31	Can delete session	8	delete_session
32	Can view session	8	view_session
33	Can add Token	9	add_token
34	Can change Token	9	change_token
35	Can delete Token	9	delete_token
36	Can view Token	9	view_token
37	Can add Token	10	add_tokenproxy
38	Can change Token	10	change_tokenproxy
39	Can delete Token	10	delete_tokenproxy
40	Can view Token	10	view_tokenproxy
41	Can add plan saa s	11	add_plansaas
42	Can change plan saa s	11	change_plansaas
43	Can delete plan saa s	11	delete_plansaas
44	Can view plan saa s	11	view_plansaas
45	Can add mesa	12	add_mesa
46	Can change mesa	12	change_mesa
47	Can delete mesa	12	delete_mesa
48	Can view mesa	12	view_mesa
49	Can add negocio	13	add_negocio
50	Can change negocio	13	change_negocio
51	Can delete negocio	13	delete_negocio
52	Can view negocio	13	view_negocio
53	Can add orden	14	add_orden
54	Can change orden	14	change_orden
55	Can delete orden	14	delete_orden
56	Can view orden	14	view_orden
57	Can add pago	15	add_pago
58	Can change pago	15	change_pago
59	Can delete pago	15	delete_pago
60	Can view pago	15	view_pago
61	Can add producto	16	add_producto
62	Can change producto	16	change_producto
63	Can delete producto	16	delete_producto
64	Can view producto	16	view_producto
65	Can add sede	17	add_sede
66	Can change sede	17	change_sede
67	Can delete sede	17	delete_sede
68	Can view sede	17	view_sede
69	Can add variacion producto	18	add_variacionproducto
70	Can change variacion producto	18	change_variacionproducto
71	Can delete variacion producto	18	delete_variacionproducto
72	Can view variacion producto	18	view_variacionproducto
73	Can add detalle orden	19	add_detalleorden
74	Can change detalle orden	19	change_detalleorden
75	Can delete detalle orden	19	delete_detalleorden
76	Can view detalle orden	19	view_detalleorden
77	Can add grupo variacion	20	add_grupovariacion
78	Can change grupo variacion	20	change_grupovariacion
79	Can delete grupo variacion	20	delete_grupovariacion
80	Can view grupo variacion	20	view_grupovariacion
81	Can add modificador rapido	21	add_modificadorrapido
82	Can change modificador rapido	21	change_modificadorrapido
83	Can delete modificador rapido	21	delete_modificadorrapido
84	Can view modificador rapido	21	view_modificadorrapido
85	Can add opcion variacion	22	add_opcionvariacion
86	Can change opcion variacion	22	change_opcionvariacion
87	Can delete opcion variacion	22	delete_opcionvariacion
88	Can view opcion variacion	22	view_opcionvariacion
89	Can add rol	23	add_rol
90	Can change rol	23	change_rol
91	Can delete rol	23	delete_rol
92	Can view rol	23	view_rol
93	Can add empleado	24	add_empleado
94	Can change empleado	24	change_empleado
95	Can delete empleado	24	delete_empleado
96	Can view empleado	24	view_empleado
97	Can add sesion caja	25	add_sesioncaja
98	Can change sesion caja	25	change_sesioncaja
99	Can delete sesion caja	25	delete_sesioncaja
100	Can view sesion caja	25	view_sesioncaja
101	Can add detalle orden opcion	26	add_detalleordenopcion
102	Can change detalle orden opcion	26	change_detalleordenopcion
103	Can delete detalle orden opcion	26	delete_detalleordenopcion
104	Can view detalle orden opcion	26	view_detalleordenopcion
105	Can add suscripcion	27	add_suscripcion
106	Can change suscripcion	27	change_suscripcion
107	Can delete suscripcion	27	delete_suscripcion
108	Can view suscripcion	27	view_suscripcion
109	Can add categoria	28	add_categoria
110	Can change categoria	28	change_categoria
111	Can delete categoria	28	delete_categoria
112	Can view categoria	28	view_categoria
113	Can add movimiento caja	29	add_movimientocaja
114	Can change movimiento caja	29	change_movimientocaja
115	Can delete movimiento caja	29	delete_movimientocaja
116	Can view movimiento caja	29	view_movimientocaja
117	Can add receta detalle	30	add_recetadetalle
118	Can change receta detalle	30	change_recetadetalle
119	Can delete receta detalle	30	delete_recetadetalle
120	Can view receta detalle	30	view_recetadetalle
121	Can add insumo base	31	add_insumobase
122	Can change insumo base	31	change_insumobase
123	Can delete insumo base	31	delete_insumobase
124	Can view insumo base	31	view_insumobase
125	Can add insumo sede	32	add_insumosede
126	Can change insumo sede	32	change_insumosede
127	Can delete insumo sede	32	delete_insumosede
128	Can view insumo sede	32	view_insumosede
129	Can add receta opcion	33	add_recetaopcion
130	Can change receta opcion	33	change_recetaopcion
131	Can delete receta opcion	33	delete_recetaopcion
132	Can view receta opcion	33	view_recetaopcion
133	Can add registro auditoria	34	add_registroauditoria
134	Can change registro auditoria	34	change_registroauditoria
135	Can delete registro auditoria	34	delete_registroauditoria
136	Can view registro auditoria	34	view_registroauditoria
137	Can add componente combo	35	add_componentecombo
138	Can change componente combo	35	change_componentecombo
139	Can delete componente combo	35	delete_componentecombo
140	Can view componente combo	35	view_componentecombo
141	Can add cupon promocional	36	add_cuponpromocional
142	Can change cupon promocional	36	change_cuponpromocional
143	Can delete cupon promocional	36	delete_cuponpromocional
144	Can view cupon promocional	36	view_cuponpromocional
145	Can add horario visibilidad	37	add_horariovisibilidad
146	Can change horario visibilidad	37	change_horariovisibilidad
147	Can delete horario visibilidad	37	delete_horariovisibilidad
148	Can view horario visibilidad	37	view_horariovisibilidad
149	Can add regla negocio	38	add_reglanegocio
150	Can change regla negocio	38	change_reglanegocio
151	Can delete regla negocio	38	delete_reglanegocio
152	Can view regla negocio	38	view_reglanegocio
153	Can add zona delivery	39	add_zonadelivery
154	Can change zona delivery	39	change_zonadelivery
155	Can delete zona delivery	39	delete_zonadelivery
156	Can view zona delivery	39	view_zonadelivery
157	Can add cliente	40	add_cliente
158	Can change cliente	40	change_cliente
159	Can delete cliente	40	delete_cliente
160	Can view cliente	40	view_cliente
161	Can add promocion bot	41	add_promocionbot
162	Can change promocion bot	41	change_promocionbot
163	Can delete promocion bot	41	delete_promocionbot
164	Can view promocion bot	41	view_promocionbot
165	Can add regla bot	42	add_reglabot
166	Can change regla bot	42	change_reglabot
167	Can delete regla bot	42	delete_reglabot
168	Can view regla bot	42	view_reglabot
169	Can add solicitud cambio	43	add_solicitudcambio
170	Can change solicitud cambio	43	change_solicitudcambio
171	Can delete solicitud cambio	43	delete_solicitudcambio
172	Can view solicitud cambio	43	view_solicitudcambio
173	Can add combo promocional	44	add_combopromocional
174	Can change combo promocional	44	change_combopromocional
175	Can delete combo promocional	44	delete_combopromocional
176	Can view combo promocional	44	view_combopromocional
177	Can add item combo promocional	45	add_itemcombopromocional
178	Can change item combo promocional	45	change_itemcombopromocional
179	Can delete item combo promocional	45	delete_itemcombopromocional
180	Can view item combo promocional	45	view_itemcombopromocional
\.


--
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.auth_user (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) FROM stdin;
1	pbkdf2_sha256$1000000$EkJ8yZOkvQeYl1qzByOvPV$QVjSKG1Kn9IXShnt25hjsshm2yEQqw5W/bqwUvvaxpk=	2026-05-12 05:44:59.433842+00	t	leybrak			leybraktech@gmail.com	t	t	2026-05-10 21:20:32.42602+00
2	pbkdf2_sha256$1000000$S42GknxB9T1IF1zi0rFiiO$VIUDaxRDd1aHTe1Ns2RdJXs54wJ3KmPdOi/4UgoPBpo=	2026-05-12 15:44:32.904581+00	f	Rollitos				f	t	2026-05-12 05:27:24.613886+00
\.


--
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.auth_user_groups (id, user_id, group_id) FROM stdin;
\.


--
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.auth_user_user_permissions (id, user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: authtoken_token; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.authtoken_token (key, created, user_id) FROM stdin;
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
1	2026-05-12 05:27:24.839618+00	2	Rollitos	1	[{"added": {}}]	4	1
2	2026-05-12 06:11:39.439736+00	1	Plan Pro	1	[{"added": {}}]	11	1
3	2026-05-12 06:12:04.00287+00	2	Plan Ultra	1	[{"added": {}}]	11	1
4	2026-05-12 06:12:16.602644+00	1	Rollitos	1	[{"added": {}}]	13	1
5	2026-05-12 15:06:20.423284+00	1	Cocinero	1	[{"added": {}}]	23	1
6	2026-05-12 15:06:31.543449+00	2	Cajero	1	[{"added": {}}]	23	1
7	2026-05-12 15:06:41.251438+00	3	Mesero	1	[{"added": {}}]	23	1
8	2026-05-12 15:06:50.383983+00	4	Administrador	1	[{"added": {}}]	23	1
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	group
4	auth	user
5	contenttypes	contenttype
6	token_blacklist	blacklistedtoken
7	token_blacklist	outstandingtoken
8	sessions	session
9	authtoken	token
10	authtoken	tokenproxy
11	negocios	plansaas
12	negocios	mesa
13	negocios	negocio
14	negocios	orden
15	negocios	pago
16	negocios	producto
17	negocios	sede
18	negocios	variacionproducto
19	negocios	detalleorden
20	negocios	grupovariacion
21	negocios	modificadorrapido
22	negocios	opcionvariacion
23	negocios	rol
24	negocios	empleado
25	negocios	sesioncaja
26	negocios	detalleordenopcion
27	negocios	suscripcion
28	negocios	categoria
29	negocios	movimientocaja
30	negocios	recetadetalle
31	negocios	insumobase
32	negocios	insumosede
33	negocios	recetaopcion
34	negocios	registroauditoria
35	negocios	componentecombo
36	negocios	cuponpromocional
37	negocios	horariovisibilidad
38	negocios	reglanegocio
39	negocios	zonadelivery
40	negocios	cliente
41	negocios	promocionbot
42	negocios	reglabot
43	negocios	solicitudcambio
44	negocios	combopromocional
45	negocios	itemcombopromocional
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2026-05-10 21:12:51.290465+00
2	auth	0001_initial	2026-05-10 21:12:51.348657+00
3	admin	0001_initial	2026-05-10 21:12:51.367544+00
4	admin	0002_logentry_remove_auto_add	2026-05-10 21:12:51.374233+00
5	admin	0003_logentry_add_action_flag_choices	2026-05-10 21:12:51.38047+00
6	contenttypes	0002_remove_content_type_name	2026-05-10 21:12:51.394095+00
7	auth	0002_alter_permission_name_max_length	2026-05-10 21:12:51.40022+00
8	auth	0003_alter_user_email_max_length	2026-05-10 21:12:51.405937+00
9	auth	0004_alter_user_username_opts	2026-05-10 21:12:51.411762+00
10	auth	0005_alter_user_last_login_null	2026-05-10 21:12:51.418067+00
11	auth	0006_require_contenttypes_0002	2026-05-10 21:12:51.419134+00
12	auth	0007_alter_validators_add_error_messages	2026-05-10 21:12:51.423941+00
13	auth	0008_alter_user_username_max_length	2026-05-10 21:12:51.4332+00
14	auth	0009_alter_user_last_name_max_length	2026-05-10 21:12:51.439342+00
15	auth	0010_alter_group_name_max_length	2026-05-10 21:12:51.44674+00
16	auth	0011_update_proxy_permissions	2026-05-10 21:12:51.45343+00
17	auth	0012_alter_user_first_name_max_length	2026-05-10 21:12:51.458907+00
18	authtoken	0001_initial	2026-05-10 21:12:51.471508+00
19	authtoken	0002_auto_20160226_1747	2026-05-10 21:12:51.488223+00
20	authtoken	0003_tokenproxy	2026-05-10 21:12:51.490292+00
21	authtoken	0004_alter_tokenproxy_options	2026-05-10 21:12:51.493593+00
22	negocios	0001_initial	2026-05-10 21:12:51.625022+00
23	negocios	0002_orden_cliente_nombre_orden_cliente_telefono	2026-05-10 21:12:51.635325+00
24	negocios	0003_orden_cancelado_orden_motivo_cancelacion_and_more	2026-05-10 21:12:51.655841+00
25	negocios	0004_producto_es_venta_rapida	2026-05-10 21:12:51.662967+00
26	negocios	0005_remove_detalleorden_variacion_and_more	2026-05-10 21:12:51.749666+00
27	negocios	0006_rol_empleado	2026-05-10 21:12:51.773272+00
28	negocios	0007_empleado_negocio_empleado_sede_alter_empleado_pin_and_more	2026-05-10 21:12:51.893121+00
29	negocios	0008_sesioncaja	2026-05-10 21:12:51.912082+00
30	negocios	0009_sesioncaja_empleado_cierra_sesioncaja_hora_cierre_and_more	2026-05-10 21:12:51.978372+00
31	negocios	0010_sesioncaja_declarado_efectivo_and_more	2026-05-10 21:12:52.020031+00
32	negocios	0011_negocio_mod_delivery_activo_negocio_numero_yape	2026-05-10 21:12:52.03762+00
33	negocios	0012_detalleordenopcion_suscripcion_and_more	2026-05-10 21:12:52.352266+00
34	negocios	0013_pago_negocios_pa_sesion__1dfabe_idx_and_more	2026-05-10 21:12:52.36987+00
35	negocios	0014_categoria_producto_categoria	2026-05-10 21:12:52.411134+00
36	negocios	0015_movimientocaja	2026-05-10 21:12:52.44131+00
37	negocios	0016_remove_negocio_mod_analiticas_activo_and_more	2026-05-10 21:12:52.520367+00
38	negocios	0017_negocio_mod_bot_wsp_activo_and_more	2026-05-10 21:12:52.669125+00
39	negocios	0018_mesa_forma_mesa_posicion_x_mesa_posicion_y	2026-05-10 21:12:52.698711+00
40	negocios	0019_insumo_recetadetalle	2026-05-10 21:12:52.75842+00
41	negocios	0020_insumobase_alter_recetadetalle_insumo_insumosede_and_more	2026-05-10 21:12:52.853831+00
42	negocios	0021_insumosede_stock_general	2026-05-10 21:12:52.865127+00
43	negocios	0022_remove_insumosede_stock_general_and_more	2026-05-10 21:12:52.88453+00
44	negocios	0023_recetaopcion	2026-05-10 21:12:52.914103+00
45	negocios	0024_orden_metodo	2026-05-10 21:12:52.923053+00
46	negocios	0025_remove_orden_metodo_alter_pago_metodo	2026-05-10 21:12:52.939033+00
47	negocios	0026_orden_mesero_orden_sesion_caja_registroauditoria	2026-05-10 21:12:53.023171+00
48	negocios	0027_sede_columnas_salon	2026-05-10 21:12:53.043321+00
49	negocios	0028_modificadorrapido_precio	2026-05-10 21:12:53.055419+00
50	negocios	0029_modificadorrapido_categorias_aplicables	2026-05-10 21:12:53.089269+00
51	negocios	0030_producto_destacar_como_promocion_producto_es_combo_and_more	2026-05-10 21:12:53.389023+00
52	negocios	0031_cliente_fecha_nacimiento	2026-05-10 21:12:53.405286+00
53	negocios	0032_sede_whatsapp_instancia_sede_whatsapp_numero	2026-05-10 21:12:53.448266+00
54	negocios	0033_orden_costo_envio_orden_direccion_entrega_and_more	2026-05-10 21:12:53.516185+00
55	negocios	0034_orden_pago_validado_bot	2026-05-10 21:12:53.531244+00
56	negocios	0035_cliente_bot_estado_cliente_bot_memoria	2026-05-10 21:12:53.555057+00
57	negocios	0036_remove_zonadelivery_distritos_cobertura_sede_latitud_and_more	2026-05-10 21:12:53.609832+00
58	negocios	0037_alter_sede_direccion_alter_sede_latitud_and_more	2026-05-10 21:12:53.751619+00
59	negocios	0038_sede_carta_pdf_sede_enlace_carta_virtual	2026-05-10 21:12:53.791853+00
60	negocios	0039_solicitudcambio	2026-05-10 21:12:53.829597+00
61	negocios	0040_rename_numero_yape_negocio_yape_numero_and_more	2026-05-10 21:12:54.055036+00
62	negocios	0041_negocio_carta_config	2026-05-10 21:12:54.07075+00
63	negocios	0042_producto_imagen	2026-05-10 21:12:54.087354+00
64	negocios	0043_sede_dias_atencion_sede_hora_apertura_and_more	2026-05-10 21:12:54.147438+00
65	negocios	0044_sede_bot_cumple_activo_sede_bot_cumple_regalo_and_more	2026-05-10 21:12:54.204663+00
66	negocios	0045_sede_bot_max_pedidos_pendientes	2026-05-10 21:12:54.226148+00
67	negocios	0046_remove_sede_bot_cumple_regalo_sede_bot_cumple_minimo_and_more	2026-05-10 21:12:54.314476+00
68	negocios	0047_alter_sede_bot_cumple_activo_and_more	2026-05-10 21:12:54.609248+00
69	negocios	0048_orden_subtotal_descuento_recargo	2026-05-10 21:12:54.654149+00
70	negocios	0049_horariovisibilidad_activa_and_more	2026-05-10 21:12:54.761555+00
71	negocios	0050_horariovisibilidad_rangos_fechas	2026-05-10 21:12:54.773555+00
72	negocios	0051_componentecombo_opcion_seleccionada_and_more	2026-05-10 21:12:54.93173+00
73	negocios	0052_remove_horariovisibilidad_mensaje_fuera_horario_and_more	2026-05-10 21:12:55.452499+00
74	negocios	0053_horariovisibilidad_opcion_variacion	2026-05-10 21:12:55.489972+00
75	negocios	0054_combopromocional_sede_horariovisibilidad_sede	2026-05-10 21:12:55.557959+00
76	sessions	0001_initial	2026-05-10 21:12:55.568384+00
77	token_blacklist	0001_initial	2026-05-10 21:12:55.654579+00
78	token_blacklist	0002_outstandingtoken_jti_hex	2026-05-10 21:12:55.664382+00
79	token_blacklist	0003_auto_20171017_2007	2026-05-10 21:12:55.69795+00
80	token_blacklist	0004_auto_20171017_2013	2026-05-10 21:12:55.710779+00
81	token_blacklist	0005_remove_outstandingtoken_jti	2026-05-10 21:12:55.719385+00
82	token_blacklist	0006_auto_20171017_2113	2026-05-10 21:12:55.72847+00
83	token_blacklist	0007_auto_20171017_2214	2026-05-10 21:12:55.772132+00
84	token_blacklist	0008_migrate_to_bigautofield	2026-05-10 21:12:55.936004+00
85	token_blacklist	0010_fix_migrate_to_bigautofield	2026-05-10 21:12:55.972404+00
86	token_blacklist	0011_linearizes_history	2026-05-10 21:12:55.974184+00
87	token_blacklist	0012_alter_outstandingtoken_user	2026-05-10 21:12:56.004716+00
88	token_blacklist	0013_alter_blacklistedtoken_options_and_more	2026-05-10 21:12:56.018033+00
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
vorqgfzknh5ku3s7zrn2bgoq3k0zbs5s	.eJxVjDsOgzAQBe_iOrLWaxbslOk5g_VsTEwSgcSninL3gESRtDPz3lsFbGsJ25LnMHTqqoy6_LKI9MzjIboHxvuk0zSu8xD1kejTLrqduvy6ne3fQcFS9jUxAdR7IEottvYJFrERx5nh4Puqoh1aJxTrqveSGCQNkyUDE1l9vtjBNx4:1wMeBP:fi6XFJGq6vJG7eA01Vb6qQmH5QC2aaLba7AdsDszEFI	2026-05-26 03:53:23.408947+00
hgqn6vg61taibxdqellwobzjy1js8fj8	.eJxVjDsOgzAQBe_iOrLWaxbslOk5g_VsTEwSgcSninL3gESRtDPz3lsFbGsJ25LnMHTqqoy6_LKI9MzjIboHxvuk0zSu8xD1kejTLrqduvy6ne3fQcFS9jUxAdR7IEottvYJFrERx5nh4Puqoh1aJxTrqveSGCQNkyUDE1l9vtjBNx4:1wMesi:VU5Au4-VbmmP8bzj57GP_2dwWoOwJJr55fR2iVebbuk	2026-05-26 04:38:08.62613+00
skmoqm51iic3jl43gxfn7etfktp92290	.eJxVjDsOgzAQBe_iOrLWaxbslOk5g_VsTEwSgcSninL3gESRtDPz3lsFbGsJ25LnMHTqqoy6_LKI9MzjIboHxvuk0zSu8xD1kejTLrqduvy6ne3fQcFS9jUxAdR7IEottvYJFrERx5nh4Puqoh1aJxTrqveSGCQNkyUDE1l9vtjBNx4:1wMfb2:yjTQaavLw6KoTVUfp4_3CI4hP2t3MRMH276dzFda3EM	2026-05-26 05:23:56.137889+00
zwxl0gpdhpdrrxw1w40gocszsc8epesd	.eJxVjDsOgzAQBe_iOrLWaxbslOk5g_VsTEwSgcSninL3gESRtDPz3lsFbGsJ25LnMHTqqoy6_LKI9MzjIboHxvuk0zSu8xD1kejTLrqduvy6ne3fQcFS9jUxAdR7IEottvYJFrERx5nh4Puqoh1aJxTrqveSGCQNkyUDE1l9vtjBNx4:1wMfvP:0aFGiqbqZR8v4zksbtcqwPKuEQ1K3GFpX94XOklZAUI	2026-05-26 05:44:59.437777+00
\.


--
-- Data for Name: negocios_categoria; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_categoria (id, nombre, orden, activo, negocio_id) FROM stdin;
1	Bebidas	0	t	1
2	Extras	0	t	1
\.


--
-- Data for Name: negocios_cliente; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_cliente (id, telefono, nombre, email, puntos_acumulados, total_gastado, cantidad_pedidos, ultima_compra, tags, negocio_id, fecha_nacimiento, bot_estado, bot_memoria) FROM stdin;
\.


--
-- Data for Name: negocios_combopromocional; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_combopromocional (id, nombre, precio, imagen, rangos_fechas, activo, creado_en, negocio_id, sede_id) FROM stdin;
\.


--
-- Data for Name: negocios_componentecombo; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_componentecombo (id, cantidad, combo_id, producto_hijo_id, opcion_seleccionada_id, variacion_seleccionada_id) FROM stdin;
\.


--
-- Data for Name: negocios_cuponpromocional; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_cuponpromocional (id, codigo, descripcion, monto_descuento, es_porcentaje, limite_usos, fecha_expiracion, activo, negocio_id) FROM stdin;
\.


--
-- Data for Name: negocios_detalleorden; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_detalleorden (id, cantidad, precio_unitario, notas_y_modificadores, orden_id, producto_id, notas_cocina, activo) FROM stdin;
1	1	5.00	{"chips": [], "nota_libre": "", "variaciones": {"2": [4]}}	1	1	Gordita	t
\.


--
-- Data for Name: negocios_detalleordenopcion; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_detalleordenopcion (id, precio_adicional_aplicado, detalle_orden_id, opcion_variacion_id) FROM stdin;
1	5.00	1	4
\.


--
-- Data for Name: negocios_empleado; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_empleado (id, nombre, pin, activo, ultimo_ingreso, rol_id, negocio_id, sede_id) FROM stdin;
1	Cocina1	pbkdf2_sha256$1000000$A34m22WURv1ukEtV9n0rfg$jQIa3La1ILg4xzsBCVTezCYl+I0sm1wJkoPgwUBttQM=	t	\N	1	1	1
\.


--
-- Data for Name: negocios_grupovariacion; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_grupovariacion (id, nombre, obligatorio, seleccion_multiple, producto_id) FROM stdin;
2	Opciones	t	f	1
\.


--
-- Data for Name: negocios_horariovisibilidad; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_horariovisibilidad (id, dias_permitidos, hora_inicio, hora_fin, producto_id, activa, categoria_id, precio_especial, tipo_promo, rangos_fechas, compra_x, creado_en, lleva_y, negocio_id, nombre, porcentaje_descuento, se_repite_semanalmente, opcion_variacion_id, sede_id) FROM stdin;
\.


--
-- Data for Name: negocios_insumobase; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_insumobase (id, nombre, unidad_medida, imagen, activo, negocio_id, stock_general) FROM stdin;
\.


--
-- Data for Name: negocios_insumosede; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_insumosede (id, stock_actual, stock_minimo, costo_unitario, insumo_base_id, sede_id) FROM stdin;
\.


--
-- Data for Name: negocios_itemcombopromocional; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_itemcombopromocional (id, cantidad, combo_id, opcion_seleccionada_id, producto_id, variacion_seleccionada_id) FROM stdin;
\.


--
-- Data for Name: negocios_mesa; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_mesa (id, numero_o_nombre, capacidad, mesa_principal_id, sede_id, activo, forma, posicion_x, posicion_y) FROM stdin;
1	1	4	\N	1	t	cuadrada	0	0
2	2	4	\N	1	t	cuadrada	1	0
\.


--
-- Data for Name: negocios_modificadorrapido; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_modificadorrapido (id, nombre, negocio_id, precio) FROM stdin;
\.


--
-- Data for Name: negocios_modificadorrapido_categorias_aplicables; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_modificadorrapido_categorias_aplicables (id, modificadorrapido_id, categoria_id) FROM stdin;
\.


--
-- Data for Name: negocios_movimientocaja; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_movimientocaja (id, tipo, monto, concepto, fecha, empleado_id, sede_id, sesion_caja_id) FROM stdin;
\.


--
-- Data for Name: negocios_negocio; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_negocio (id, nombre, fecha_registro, fin_prueba, activo, mod_cocina_activo, mod_inventario_activo, propietario_id, mod_delivery_activo, yape_numero, color_primario, mod_clientes_activo, mod_facturacion_activo, mod_salon_activo, tema_fondo, mod_bot_wsp_activo, mod_carta_qr_activo, mod_ml_activo, plan_id, culqi_private_key, culqi_public_key, logo, plin_numero, plin_qr, razon_social, ruc, usa_culqi, yape_qr, carta_config) FROM stdin;
1	Rollitos	2026-05-12 06:12:16.598132+00	2026-05-13 23:00:00+00	t	t	t	2	t	932264014	#3b82f6	t	t	t	dark	t	t	t	2							\N	f		{}
\.


--
-- Data for Name: negocios_opcionvariacion; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_opcionvariacion (id, nombre, precio_adicional, grupo_id) FROM stdin;
3	Personal	3.50	2
4	Gordita	5.00	2
\.


--
-- Data for Name: negocios_orden; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_orden (id, tipo, estado, total, creado_en, mesa_id, sede_id, cliente_nombre, cliente_telefono, motivo_cancelacion, estado_pago, mesero_id, sesion_caja_id, costo_envio, direccion_entrega, latitud, longitud, metodo_pago_esperado, pago_validado_bot, subtotal, descuento_total, recargo_total) FROM stdin;
1	salon	completado	5.00	2026-05-12 06:22:57.233866+00	1	1			\N	pagado	\N	\N	0.00	\N	\N	\N	\N	f	5.00	0.00	0.00
\.


--
-- Data for Name: negocios_pago; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_pago (id, metodo, monto, fecha_pago, orden_id, sesion_caja_id) FROM stdin;
1	efectivo	5.00	2026-05-12 06:23:07.528409+00	1	\N
\.


--
-- Data for Name: negocios_plansaas; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_plansaas (id, nombre, precio_mensual, modulo_kds, modulo_inventario, modulo_delivery, max_sedes, modulo_bot_wsp, modulo_carta_qr, modulo_ml) FROM stdin;
1	Plan Pro	80.00	t	t	t	1	f	t	f
2	Plan Ultra	150.00	t	t	t	4	t	t	t
\.


--
-- Data for Name: negocios_producto; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_producto (id, nombre, precio_base, disponible, tiene_variaciones, negocio_id, es_venta_rapida, requiere_seleccion, activo, categoria_id, destacar_como_promocion, es_combo, imagen) FROM stdin;
1	InkaCola	0.00	t	f	1	f	t	t	1	f	f	
\.


--
-- Data for Name: negocios_promocionbot; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_promocionbot (id, nombre, tipo, mensaje_gancho, activa, cupon_id, sede_id) FROM stdin;
\.


--
-- Data for Name: negocios_recetadetalle; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_recetadetalle (id, cantidad_necesaria, insumo_id, producto_id) FROM stdin;
\.


--
-- Data for Name: negocios_recetaopcion; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_recetaopcion (id, cantidad_necesaria, insumo_id, opcion_id) FROM stdin;
\.


--
-- Data for Name: negocios_registroauditoria; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_registroauditoria (id, empleado_nombre, accion, descripcion, fecha, empleado_id, orden_id, sede_id) FROM stdin;
\.


--
-- Data for Name: negocios_reglabot; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_reglabot (id, trigger, mensaje, activa, sede_id) FROM stdin;
\.


--
-- Data for Name: negocios_reglanegocio; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_reglanegocio (id, tipo, valor, es_porcentaje, monto_minimo_orden, dia_semana, activa, negocio_id, accion_aplica_a, accion_categoria_id, accion_es_descuento, accion_producto_id, condicion_hora_fin, condicion_hora_inicio, condicion_metodo_pago, condicion_tipo_orden, nombre) FROM stdin;
\.


--
-- Data for Name: negocios_rol; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_rol (id, nombre, puede_cobrar, puede_configurar) FROM stdin;
1	Cocinero	f	f
2	Cajero	t	f
3	Mesero	t	f
4	Administrador	t	t
\.


--
-- Data for Name: negocios_sede; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_sede (id, nombre, direccion, negocio_id, activo, columnas_salon, whatsapp_instancia, whatsapp_numero, latitud, longitud, carta_pdf, enlace_carta_virtual, dias_atencion, hora_apertura, hora_cierre, bot_cumple_activo, bot_puntos_activos, bot_max_pedidos_pendientes, bot_cumple_minimo, bot_cumple_tipo, bot_cumple_valor) FROM stdin;
1	Principal		1	t	2	\N	\N	-11.8292614	-77.1293641		\N	["Lunes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]	18:00:00	23:00:00	f	t	20	\N	porcentaje	\N
\.


--
-- Data for Name: negocios_sede_bot_cumple_productos; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_sede_bot_cumple_productos (id, sede_id, producto_id) FROM stdin;
\.


--
-- Data for Name: negocios_sesioncaja; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_sesioncaja (id, hora_apertura, fondo_inicial, estado, empleado_abre_id, empleado_cierra_id, hora_cierre, sede_id, ventas_digitales, ventas_efectivo, declarado_efectivo, declarado_tarjeta, declarado_yape, diferencia, esperado_digital, esperado_efectivo) FROM stdin;
\.


--
-- Data for Name: negocios_solicitudcambio; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_solicitudcambio (id, tipo_accion, detalles_json, estado, creado_en, orden_id) FROM stdin;
\.


--
-- Data for Name: negocios_suscripcion; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_suscripcion (id, fecha_inicio, fecha_fin, activa, negocio_id, plan_id) FROM stdin;
\.


--
-- Data for Name: negocios_variacionproducto; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_variacionproducto (id, nombre, precio, producto_id) FROM stdin;
\.


--
-- Data for Name: negocios_zonadelivery; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.negocios_zonadelivery (id, nombre, costo_envio, pedido_minimo, activa, sede_id, radio_max_km) FROM stdin;
\.


--
-- Data for Name: token_blacklist_blacklistedtoken; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.token_blacklist_blacklistedtoken (id, blacklisted_at, token_id) FROM stdin;
1	2026-05-12 00:55:06.300387+00	1
2	2026-05-12 15:59:37.610202+00	8
3	2026-05-12 16:14:37.881132+00	9
4	2026-05-12 16:29:37.810808+00	10
5	2026-05-12 16:44:37.583369+00	11
6	2026-05-12 16:59:37.714628+00	12
\.


--
-- Data for Name: token_blacklist_outstandingtoken; Type: TABLE DATA; Schema: public; Owner: bravapos_user
--

COPY public.token_blacklist_outstandingtoken (id, token, created_at, expires_at, user_id, jti) FROM stdin;
1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTE1MTE2MywiaWF0IjoxNzc4NTQ2MzYzLCJqdGkiOiIwOTM0OTE4ZTI4ZDE0MGRiYmI2ZTJhMTU0NmI5YmEwZiIsInVzZXJfaWQiOiIxIn0.h9Y9H5GpIi3fSgezEJFwH4YsGkKAad0-tEYTYCYzNao	2026-05-12 00:39:23.888966+00	2026-05-19 00:39:23+00	1	0934918e28d140dbbb6e2a1546b9ba0f
2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTE1MTE5NSwiaWF0IjoxNzc4NTQ2Mzk1LCJqdGkiOiI3YzQ3MjEwZjVjYjQ0YjVhYTAyZDc1N2I4NTViM2NjNCIsInVzZXJfaWQiOiIxIn0.DBPjYDHEMwCAkgH-kx8mShQAbF2Cw7ehY4RKLAjJ3jM	2026-05-12 00:39:55.023578+00	2026-05-19 00:39:55+00	1	7c47210f5cb44b5aa02d757b855b3cc4
3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTE1MjEwNiwiaWF0IjoxNzc4NTQ3MzA2LCJqdGkiOiIwZTUwM2VhNDc0YTc0NjQ5YmQ1NWY0ODBkM2NlM2Y5YSIsInVzZXJfaWQiOiIxIn0.PJJKyLh1YDoxpbXNCMytKe1q3YdJjfaYU7ChRyta02A	2026-05-12 00:55:06.280937+00	2026-05-19 00:55:06+00	1	0e503ea474a74649bd55f480d3ce3f9a
4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTE3MTQwNSwiaWF0IjoxNzc4NTY2NjA1LCJqdGkiOiIzNTVkYjJmY2Y1ODg0ZTBhOGZkY2NiZDI4ZjRmY2YyMyIsInVzZXJfaWQiOiIyIn0.G5-WcM8cFGMMLSm3jO3i2grihl-HBEBqgDs2GPtOrdE	2026-05-12 06:16:45.557538+00	2026-05-19 06:16:45+00	2	355db2fcf5884e0a8fdccbd28f4fcf23
5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTIwMjMxOSwiaWF0IjoxNzc4NTk3NTE5LCJqdGkiOiJmY2ZiNGY3OWMyMGU0YTI1OTQ2ODI0MjEwMjZlZmFhMCIsInVzZXJfaWQiOiIyIn0.-GvGFJNIYyxE0CtINX5CKs14qcCg-0KVnQtsiJd3Z6w	2026-05-12 14:51:59.949214+00	2026-05-19 14:51:59+00	2	fcfb4f79c20e4a2594682421026efaa0
6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTIwMzI5MSwiaWF0IjoxNzc4NTk4NDkxLCJqdGkiOiI5ZmZjMDM4YmQ0MDQ0MmFjYWI4ZWMwYzZmYjNmYzY1NyIsInVzZXJfaWQiOiIyIn0.lMWqi-N_eS7WpcVck7BuNeTSDCg1_PzpT0OCU0DNBSQ	2026-05-12 15:08:11.616694+00	2026-05-19 15:08:11+00	2	9ffc038bd40442acab8ec0c6fb3fc657
7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTIwNDQ2MywiaWF0IjoxNzc4NTk5NjYzLCJqdGkiOiI1YTRlYzVhZTkyMTI0M2JkODBmN2RkMTg2MTQyMTk5MyIsInVzZXJfaWQiOiIyIn0.ALHEzPWL1HLw0W13DX9PJr22nK4x2tuPYZ7CiDzalPc	2026-05-12 15:27:43.363297+00	2026-05-19 15:27:43+00	2	5a4ec5ae921243bd80f7dd1861421993
8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTIwNTQ3MiwiaWF0IjoxNzc4NjAwNjcyLCJqdGkiOiI0NDExYTJlOTU1YTg0MDA3YmQxYmY1MTM5Yjc3MzljNSIsInVzZXJfaWQiOiIyIn0.0E6yj0abnWJKUxbvdKWKBJGj00Isgj58vms2YwmNVTE	2026-05-12 15:44:32.899334+00	2026-05-19 15:44:32+00	2	4411a2e955a84007bd1bf5139b7739c5
9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTIwNjM3NywiaWF0IjoxNzc4NjAxNTc3LCJqdGkiOiIxZWZlNjIyNzk1Yjg0MmY0YmNjMjU1YmZmYTUzZDUyYSIsInVzZXJfaWQiOiIyIiwibmVnb2Npb19pZCI6MSwicm9sIjoiRHVlXHUwMGYxbyJ9.KrDDbsNJOSiU6vtkyWVHZ6fZAOuc_yC1biI_JpcrIjY	2026-05-12 15:59:37.592459+00	2026-05-19 15:59:37+00	2	1efe622795b842f4bcc255bffa53d52a
10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTIwNzI3NywiaWF0IjoxNzc4NjAyNDc3LCJqdGkiOiI2ZmQ3ZDVlOGE5YzE0OWQ3OGU3MWNhZjExZDM5M2FmMyIsInVzZXJfaWQiOiIyIiwibmVnb2Npb19pZCI6MSwicm9sIjoiRHVlXHUwMGYxbyJ9.b1H9RD_7OhCykCVLr6M22G-C2y1lL310DJLygU7B84o	2026-05-12 16:14:37.866053+00	2026-05-19 16:14:37+00	2	6fd7d5e8a9c149d78e71caf11d393af3
11	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTIwODE3NywiaWF0IjoxNzc4NjAzMzc3LCJqdGkiOiI4NGNmYmI4OGE2N2Q0ZTJmOGY1NzRiYThhYTQ5ZmZjMiIsInVzZXJfaWQiOiIyIiwibmVnb2Npb19pZCI6MSwicm9sIjoiRHVlXHUwMGYxbyJ9.UqYMn6tK1EH6UPsD1qQe0XCEvzmpavcx-HHdphvnp1s	2026-05-12 16:29:37.796864+00	2026-05-19 16:29:37+00	2	84cfbb88a67d4e2f8f574ba8aa49ffc2
12	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTIwOTA3NywiaWF0IjoxNzc4NjA0Mjc3LCJqdGkiOiI0OGJhNDgyNzNjNjE0OGM3YTk4ZjkyZTJjMzE5NzdhMSIsInVzZXJfaWQiOiIyIiwibmVnb2Npb19pZCI6MSwicm9sIjoiRHVlXHUwMGYxbyJ9.GxxlHRNtMwMYibR6VAC33ge294guw-UPOsT6-Zaanek	2026-05-12 16:44:37.566244+00	2026-05-19 16:44:37+00	2	48ba48273c6148c7a98f92e2c31977a1
13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3OTIwOTk3NywiaWF0IjoxNzc4NjA1MTc3LCJqdGkiOiJjOGU0YjhjMjBlZGU0ZjU0YjA0YWE0Njg4MjQyNjM5MSIsInVzZXJfaWQiOiIyIiwibmVnb2Npb19pZCI6MSwicm9sIjoiRHVlXHUwMGYxbyJ9.0ALln1M_k3nDyCDs2TtY5A__etejVeI2QQDK3xlVm3c	2026-05-12 16:59:37.693089+00	2026-05-19 16:59:37+00	2	c8e4b8c20ede4f54b04aa46882426391
\.


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 180, true);


--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 1, false);


--
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 2, true);


--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 1, false);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 8, true);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 45, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 88, true);


--
-- Name: negocios_categoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_categoria_id_seq', 2, true);


--
-- Name: negocios_cliente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_cliente_id_seq', 1, false);


--
-- Name: negocios_combopromocional_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_combopromocional_id_seq', 1, false);


--
-- Name: negocios_componentecombo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_componentecombo_id_seq', 1, false);


--
-- Name: negocios_cuponpromocional_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_cuponpromocional_id_seq', 1, false);


--
-- Name: negocios_detalleorden_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_detalleorden_id_seq', 1, true);


--
-- Name: negocios_detalleordenopcion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_detalleordenopcion_id_seq', 1, true);


--
-- Name: negocios_empleado_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_empleado_id_seq', 1, true);


--
-- Name: negocios_grupovariacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_grupovariacion_id_seq', 2, true);


--
-- Name: negocios_horariovisibilidad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_horariovisibilidad_id_seq', 1, false);


--
-- Name: negocios_insumobase_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_insumobase_id_seq', 1, false);


--
-- Name: negocios_insumosede_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_insumosede_id_seq', 1, false);


--
-- Name: negocios_itemcombopromocional_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_itemcombopromocional_id_seq', 1, false);


--
-- Name: negocios_mesa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_mesa_id_seq', 2, true);


--
-- Name: negocios_modificadorrapido_categorias_aplicables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_modificadorrapido_categorias_aplicables_id_seq', 1, false);


--
-- Name: negocios_modificadorrapido_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_modificadorrapido_id_seq', 1, false);


--
-- Name: negocios_movimientocaja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_movimientocaja_id_seq', 1, false);


--
-- Name: negocios_negocio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_negocio_id_seq', 1, true);


--
-- Name: negocios_opcionvariacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_opcionvariacion_id_seq', 4, true);


--
-- Name: negocios_orden_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_orden_id_seq', 1, true);


--
-- Name: negocios_pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_pago_id_seq', 1, true);


--
-- Name: negocios_plansaas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_plansaas_id_seq', 2, true);


--
-- Name: negocios_producto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_producto_id_seq', 1, true);


--
-- Name: negocios_promocionbot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_promocionbot_id_seq', 1, false);


--
-- Name: negocios_recetadetalle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_recetadetalle_id_seq', 1, false);


--
-- Name: negocios_recetaopcion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_recetaopcion_id_seq', 1, false);


--
-- Name: negocios_registroauditoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_registroauditoria_id_seq', 1, false);


--
-- Name: negocios_reglabot_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_reglabot_id_seq', 1, false);


--
-- Name: negocios_reglanegocio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_reglanegocio_id_seq', 1, false);


--
-- Name: negocios_rol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_rol_id_seq', 4, true);


--
-- Name: negocios_sede_bot_cumple_productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_sede_bot_cumple_productos_id_seq', 1, false);


--
-- Name: negocios_sede_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_sede_id_seq', 1, true);


--
-- Name: negocios_sesioncaja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_sesioncaja_id_seq', 1, false);


--
-- Name: negocios_solicitudcambio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_solicitudcambio_id_seq', 1, false);


--
-- Name: negocios_suscripcion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_suscripcion_id_seq', 1, false);


--
-- Name: negocios_variacionproducto_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_variacionproducto_id_seq', 1, false);


--
-- Name: negocios_zonadelivery_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.negocios_zonadelivery_id_seq', 1, false);


--
-- Name: token_blacklist_blacklistedtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.token_blacklist_blacklistedtoken_id_seq', 6, true);


--
-- Name: token_blacklist_outstandingtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: bravapos_user
--

SELECT pg_catalog.setval('public.token_blacklist_outstandingtoken_id_seq', 13, true);


--
-- Name: Chat Chat_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Chat"
    ADD CONSTRAINT "Chat_pkey" PRIMARY KEY (id);


--
-- Name: Chatwoot Chatwoot_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Chatwoot"
    ADD CONSTRAINT "Chatwoot_pkey" PRIMARY KEY (id);


--
-- Name: Contact Contact_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY (id);


--
-- Name: DifySetting DifySetting_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."DifySetting"
    ADD CONSTRAINT "DifySetting_pkey" PRIMARY KEY (id);


--
-- Name: Dify Dify_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Dify"
    ADD CONSTRAINT "Dify_pkey" PRIMARY KEY (id);


--
-- Name: EvoaiSetting EvoaiSetting_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."EvoaiSetting"
    ADD CONSTRAINT "EvoaiSetting_pkey" PRIMARY KEY (id);


--
-- Name: Evoai Evoai_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Evoai"
    ADD CONSTRAINT "Evoai_pkey" PRIMARY KEY (id);


--
-- Name: EvolutionBotSetting EvolutionBotSetting_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_pkey" PRIMARY KEY (id);


--
-- Name: EvolutionBot EvolutionBot_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."EvolutionBot"
    ADD CONSTRAINT "EvolutionBot_pkey" PRIMARY KEY (id);


--
-- Name: FlowiseSetting FlowiseSetting_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_pkey" PRIMARY KEY (id);


--
-- Name: Flowise Flowise_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Flowise"
    ADD CONSTRAINT "Flowise_pkey" PRIMARY KEY (id);


--
-- Name: Instance Instance_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Instance"
    ADD CONSTRAINT "Instance_pkey" PRIMARY KEY (id);


--
-- Name: IntegrationSession IntegrationSession_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."IntegrationSession"
    ADD CONSTRAINT "IntegrationSession_pkey" PRIMARY KEY (id);


--
-- Name: IsOnWhatsapp IsOnWhatsapp_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."IsOnWhatsapp"
    ADD CONSTRAINT "IsOnWhatsapp_pkey" PRIMARY KEY (id);


--
-- Name: Kafka Kafka_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Kafka"
    ADD CONSTRAINT "Kafka_pkey" PRIMARY KEY (id);


--
-- Name: Label Label_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Label"
    ADD CONSTRAINT "Label_pkey" PRIMARY KEY (id);


--
-- Name: Media Media_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Media"
    ADD CONSTRAINT "Media_pkey" PRIMARY KEY (id);


--
-- Name: MessageUpdate MessageUpdate_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: N8nSetting N8nSetting_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."N8nSetting"
    ADD CONSTRAINT "N8nSetting_pkey" PRIMARY KEY (id);


--
-- Name: N8n N8n_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."N8n"
    ADD CONSTRAINT "N8n_pkey" PRIMARY KEY (id);


--
-- Name: Nats Nats_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Nats"
    ADD CONSTRAINT "Nats_pkey" PRIMARY KEY (id);


--
-- Name: OpenaiBot OpenaiBot_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_pkey" PRIMARY KEY (id);


--
-- Name: OpenaiCreds OpenaiCreds_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."OpenaiCreds"
    ADD CONSTRAINT "OpenaiCreds_pkey" PRIMARY KEY (id);


--
-- Name: OpenaiSetting OpenaiSetting_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_pkey" PRIMARY KEY (id);


--
-- Name: Proxy Proxy_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Proxy"
    ADD CONSTRAINT "Proxy_pkey" PRIMARY KEY (id);


--
-- Name: Pusher Pusher_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Pusher"
    ADD CONSTRAINT "Pusher_pkey" PRIMARY KEY (id);


--
-- Name: Rabbitmq Rabbitmq_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Rabbitmq"
    ADD CONSTRAINT "Rabbitmq_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: Sqs Sqs_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Sqs"
    ADD CONSTRAINT "Sqs_pkey" PRIMARY KEY (id);


--
-- Name: Template Template_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Template"
    ADD CONSTRAINT "Template_pkey" PRIMARY KEY (id);


--
-- Name: TypebotSetting TypebotSetting_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_pkey" PRIMARY KEY (id);


--
-- Name: Typebot Typebot_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Typebot"
    ADD CONSTRAINT "Typebot_pkey" PRIMARY KEY (id);


--
-- Name: Webhook Webhook_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Webhook"
    ADD CONSTRAINT "Webhook_pkey" PRIMARY KEY (id);


--
-- Name: Websocket Websocket_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Websocket"
    ADD CONSTRAINT "Websocket_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: authtoken_token authtoken_token_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.authtoken_token
    ADD CONSTRAINT authtoken_token_pkey PRIMARY KEY (key);


--
-- Name: authtoken_token authtoken_token_user_id_key; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.authtoken_token
    ADD CONSTRAINT authtoken_token_user_id_key UNIQUE (user_id);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: negocios_categoria negocios_categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_categoria
    ADD CONSTRAINT negocios_categoria_pkey PRIMARY KEY (id);


--
-- Name: negocios_cliente negocios_cliente_negocio_id_telefono_c276585e_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_cliente
    ADD CONSTRAINT negocios_cliente_negocio_id_telefono_c276585e_uniq UNIQUE (negocio_id, telefono);


--
-- Name: negocios_cliente negocios_cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_cliente
    ADD CONSTRAINT negocios_cliente_pkey PRIMARY KEY (id);


--
-- Name: negocios_combopromocional negocios_combopromocional_negocio_id_nombre_c9c92dc0_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_combopromocional
    ADD CONSTRAINT negocios_combopromocional_negocio_id_nombre_c9c92dc0_uniq UNIQUE (negocio_id, nombre);


--
-- Name: negocios_combopromocional negocios_combopromocional_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_combopromocional
    ADD CONSTRAINT negocios_combopromocional_pkey PRIMARY KEY (id);


--
-- Name: negocios_componentecombo negocios_componentecombo_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_componentecombo
    ADD CONSTRAINT negocios_componentecombo_pkey PRIMARY KEY (id);


--
-- Name: negocios_cuponpromocional negocios_cuponpromocional_codigo_key; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_cuponpromocional
    ADD CONSTRAINT negocios_cuponpromocional_codigo_key UNIQUE (codigo);


--
-- Name: negocios_cuponpromocional negocios_cuponpromocional_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_cuponpromocional
    ADD CONSTRAINT negocios_cuponpromocional_pkey PRIMARY KEY (id);


--
-- Name: negocios_detalleorden negocios_detalleorden_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_detalleorden
    ADD CONSTRAINT negocios_detalleorden_pkey PRIMARY KEY (id);


--
-- Name: negocios_detalleordenopcion negocios_detalleordenopcion_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_detalleordenopcion
    ADD CONSTRAINT negocios_detalleordenopcion_pkey PRIMARY KEY (id);


--
-- Name: negocios_empleado negocios_empleado_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_empleado
    ADD CONSTRAINT negocios_empleado_pkey PRIMARY KEY (id);


--
-- Name: negocios_grupovariacion negocios_grupovariacion_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_grupovariacion
    ADD CONSTRAINT negocios_grupovariacion_pkey PRIMARY KEY (id);


--
-- Name: negocios_horariovisibilidad negocios_horariovisibilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_horariovisibilidad
    ADD CONSTRAINT negocios_horariovisibilidad_pkey PRIMARY KEY (id);


--
-- Name: negocios_insumobase negocios_insumobase_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_insumobase
    ADD CONSTRAINT negocios_insumobase_pkey PRIMARY KEY (id);


--
-- Name: negocios_insumosede negocios_insumosede_insumo_base_id_sede_id_440b4ff3_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_insumosede
    ADD CONSTRAINT negocios_insumosede_insumo_base_id_sede_id_440b4ff3_uniq UNIQUE (insumo_base_id, sede_id);


--
-- Name: negocios_insumosede negocios_insumosede_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_insumosede
    ADD CONSTRAINT negocios_insumosede_pkey PRIMARY KEY (id);


--
-- Name: negocios_itemcombopromocional negocios_itemcombopromocional_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_itemcombopromocional
    ADD CONSTRAINT negocios_itemcombopromocional_pkey PRIMARY KEY (id);


--
-- Name: negocios_mesa negocios_mesa_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_mesa
    ADD CONSTRAINT negocios_mesa_pkey PRIMARY KEY (id);


--
-- Name: negocios_mesa negocios_mesa_sede_id_numero_o_nombre_5c5e61c5_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_mesa
    ADD CONSTRAINT negocios_mesa_sede_id_numero_o_nombre_5c5e61c5_uniq UNIQUE (sede_id, numero_o_nombre);


--
-- Name: negocios_modificadorrapido_categorias_aplicables negocios_modificadorrapi_modificadorrapido_id_cat_d5204a2b_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_modificadorrapido_categorias_aplicables
    ADD CONSTRAINT negocios_modificadorrapi_modificadorrapido_id_cat_d5204a2b_uniq UNIQUE (modificadorrapido_id, categoria_id);


--
-- Name: negocios_modificadorrapido_categorias_aplicables negocios_modificadorrapido_categorias_aplicables_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_modificadorrapido_categorias_aplicables
    ADD CONSTRAINT negocios_modificadorrapido_categorias_aplicables_pkey PRIMARY KEY (id);


--
-- Name: negocios_modificadorrapido negocios_modificadorrapido_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_modificadorrapido
    ADD CONSTRAINT negocios_modificadorrapido_pkey PRIMARY KEY (id);


--
-- Name: negocios_movimientocaja negocios_movimientocaja_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_movimientocaja
    ADD CONSTRAINT negocios_movimientocaja_pkey PRIMARY KEY (id);


--
-- Name: negocios_negocio negocios_negocio_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_negocio
    ADD CONSTRAINT negocios_negocio_pkey PRIMARY KEY (id);


--
-- Name: negocios_negocio negocios_negocio_propietario_id_key; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_negocio
    ADD CONSTRAINT negocios_negocio_propietario_id_key UNIQUE (propietario_id);


--
-- Name: negocios_negocio negocios_negocio_ruc_key; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_negocio
    ADD CONSTRAINT negocios_negocio_ruc_key UNIQUE (ruc);


--
-- Name: negocios_opcionvariacion negocios_opcionvariacion_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_opcionvariacion
    ADD CONSTRAINT negocios_opcionvariacion_pkey PRIMARY KEY (id);


--
-- Name: negocios_orden negocios_orden_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_orden
    ADD CONSTRAINT negocios_orden_pkey PRIMARY KEY (id);


--
-- Name: negocios_pago negocios_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_pago
    ADD CONSTRAINT negocios_pago_pkey PRIMARY KEY (id);


--
-- Name: negocios_plansaas negocios_plansaas_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_plansaas
    ADD CONSTRAINT negocios_plansaas_pkey PRIMARY KEY (id);


--
-- Name: negocios_producto negocios_producto_negocio_id_nombre_2dc27fc7_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_producto
    ADD CONSTRAINT negocios_producto_negocio_id_nombre_2dc27fc7_uniq UNIQUE (negocio_id, nombre);


--
-- Name: negocios_producto negocios_producto_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_producto
    ADD CONSTRAINT negocios_producto_pkey PRIMARY KEY (id);


--
-- Name: negocios_promocionbot negocios_promocionbot_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_promocionbot
    ADD CONSTRAINT negocios_promocionbot_pkey PRIMARY KEY (id);


--
-- Name: negocios_recetadetalle negocios_recetadetalle_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_recetadetalle
    ADD CONSTRAINT negocios_recetadetalle_pkey PRIMARY KEY (id);


--
-- Name: negocios_recetaopcion negocios_recetaopcion_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_recetaopcion
    ADD CONSTRAINT negocios_recetaopcion_pkey PRIMARY KEY (id);


--
-- Name: negocios_registroauditoria negocios_registroauditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_registroauditoria
    ADD CONSTRAINT negocios_registroauditoria_pkey PRIMARY KEY (id);


--
-- Name: negocios_reglabot negocios_reglabot_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_reglabot
    ADD CONSTRAINT negocios_reglabot_pkey PRIMARY KEY (id);


--
-- Name: negocios_reglabot negocios_reglabot_sede_id_trigger_6964d055_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_reglabot
    ADD CONSTRAINT negocios_reglabot_sede_id_trigger_6964d055_uniq UNIQUE (sede_id, trigger);


--
-- Name: negocios_reglanegocio negocios_reglanegocio_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_reglanegocio
    ADD CONSTRAINT negocios_reglanegocio_pkey PRIMARY KEY (id);


--
-- Name: negocios_rol negocios_rol_nombre_key; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_rol
    ADD CONSTRAINT negocios_rol_nombre_key UNIQUE (nombre);


--
-- Name: negocios_rol negocios_rol_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_rol
    ADD CONSTRAINT negocios_rol_pkey PRIMARY KEY (id);


--
-- Name: negocios_sede_bot_cumple_productos negocios_sede_bot_cumple_productos_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sede_bot_cumple_productos
    ADD CONSTRAINT negocios_sede_bot_cumple_productos_pkey PRIMARY KEY (id);


--
-- Name: negocios_sede_bot_cumple_productos negocios_sede_bot_cumple_sede_id_producto_id_280e2f33_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sede_bot_cumple_productos
    ADD CONSTRAINT negocios_sede_bot_cumple_sede_id_producto_id_280e2f33_uniq UNIQUE (sede_id, producto_id);


--
-- Name: negocios_sede negocios_sede_negocio_id_nombre_6dff96f0_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sede
    ADD CONSTRAINT negocios_sede_negocio_id_nombre_6dff96f0_uniq UNIQUE (negocio_id, nombre);


--
-- Name: negocios_sede negocios_sede_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sede
    ADD CONSTRAINT negocios_sede_pkey PRIMARY KEY (id);


--
-- Name: negocios_sesioncaja negocios_sesioncaja_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sesioncaja
    ADD CONSTRAINT negocios_sesioncaja_pkey PRIMARY KEY (id);


--
-- Name: negocios_solicitudcambio negocios_solicitudcambio_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_solicitudcambio
    ADD CONSTRAINT negocios_solicitudcambio_pkey PRIMARY KEY (id);


--
-- Name: negocios_suscripcion negocios_suscripcion_negocio_id_key; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_suscripcion
    ADD CONSTRAINT negocios_suscripcion_negocio_id_key UNIQUE (negocio_id);


--
-- Name: negocios_suscripcion negocios_suscripcion_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_suscripcion
    ADD CONSTRAINT negocios_suscripcion_pkey PRIMARY KEY (id);


--
-- Name: negocios_variacionproducto negocios_variacionproducto_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_variacionproducto
    ADD CONSTRAINT negocios_variacionproducto_pkey PRIMARY KEY (id);


--
-- Name: negocios_zonadelivery negocios_zonadelivery_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_zonadelivery
    ADD CONSTRAINT negocios_zonadelivery_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_token_id_key; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_token_id_key UNIQUE (token_id);


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq UNIQUE (jti);


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outstandingtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outstandingtoken_pkey PRIMARY KEY (id);


--
-- Name: Chat_instanceId_idx; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE INDEX "Chat_instanceId_idx" ON evolution."Chat" USING btree ("instanceId");


--
-- Name: Chat_instanceId_remoteJid_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Chat_instanceId_remoteJid_key" ON evolution."Chat" USING btree ("instanceId", "remoteJid");


--
-- Name: Chat_remoteJid_idx; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE INDEX "Chat_remoteJid_idx" ON evolution."Chat" USING btree ("remoteJid");


--
-- Name: Chatwoot_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Chatwoot_instanceId_key" ON evolution."Chatwoot" USING btree ("instanceId");


--
-- Name: Contact_instanceId_idx; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE INDEX "Contact_instanceId_idx" ON evolution."Contact" USING btree ("instanceId");


--
-- Name: Contact_remoteJid_idx; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE INDEX "Contact_remoteJid_idx" ON evolution."Contact" USING btree ("remoteJid");


--
-- Name: Contact_remoteJid_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Contact_remoteJid_instanceId_key" ON evolution."Contact" USING btree ("remoteJid", "instanceId");


--
-- Name: DifySetting_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "DifySetting_instanceId_key" ON evolution."DifySetting" USING btree ("instanceId");


--
-- Name: EvoaiSetting_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "EvoaiSetting_instanceId_key" ON evolution."EvoaiSetting" USING btree ("instanceId");


--
-- Name: EvolutionBotSetting_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "EvolutionBotSetting_instanceId_key" ON evolution."EvolutionBotSetting" USING btree ("instanceId");


--
-- Name: FlowiseSetting_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "FlowiseSetting_instanceId_key" ON evolution."FlowiseSetting" USING btree ("instanceId");


--
-- Name: Instance_name_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Instance_name_key" ON evolution."Instance" USING btree (name);


--
-- Name: IsOnWhatsapp_remoteJid_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "IsOnWhatsapp_remoteJid_key" ON evolution."IsOnWhatsapp" USING btree ("remoteJid");


--
-- Name: Kafka_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Kafka_instanceId_key" ON evolution."Kafka" USING btree ("instanceId");


--
-- Name: Label_labelId_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Label_labelId_instanceId_key" ON evolution."Label" USING btree ("labelId", "instanceId");


--
-- Name: Media_messageId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Media_messageId_key" ON evolution."Media" USING btree ("messageId");


--
-- Name: MessageUpdate_instanceId_idx; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE INDEX "MessageUpdate_instanceId_idx" ON evolution."MessageUpdate" USING btree ("instanceId");


--
-- Name: MessageUpdate_messageId_idx; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE INDEX "MessageUpdate_messageId_idx" ON evolution."MessageUpdate" USING btree ("messageId");


--
-- Name: Message_instanceId_idx; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE INDEX "Message_instanceId_idx" ON evolution."Message" USING btree ("instanceId");


--
-- Name: N8nSetting_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "N8nSetting_instanceId_key" ON evolution."N8nSetting" USING btree ("instanceId");


--
-- Name: Nats_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Nats_instanceId_key" ON evolution."Nats" USING btree ("instanceId");


--
-- Name: OpenaiCreds_apiKey_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "OpenaiCreds_apiKey_key" ON evolution."OpenaiCreds" USING btree ("apiKey");


--
-- Name: OpenaiCreds_name_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "OpenaiCreds_name_key" ON evolution."OpenaiCreds" USING btree (name);


--
-- Name: OpenaiSetting_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "OpenaiSetting_instanceId_key" ON evolution."OpenaiSetting" USING btree ("instanceId");


--
-- Name: OpenaiSetting_openaiCredsId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "OpenaiSetting_openaiCredsId_key" ON evolution."OpenaiSetting" USING btree ("openaiCredsId");


--
-- Name: Proxy_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Proxy_instanceId_key" ON evolution."Proxy" USING btree ("instanceId");


--
-- Name: Pusher_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Pusher_instanceId_key" ON evolution."Pusher" USING btree ("instanceId");


--
-- Name: Rabbitmq_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Rabbitmq_instanceId_key" ON evolution."Rabbitmq" USING btree ("instanceId");


--
-- Name: Session_sessionId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Session_sessionId_key" ON evolution."Session" USING btree ("sessionId");


--
-- Name: Setting_instanceId_idx; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE INDEX "Setting_instanceId_idx" ON evolution."Setting" USING btree ("instanceId");


--
-- Name: Setting_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Setting_instanceId_key" ON evolution."Setting" USING btree ("instanceId");


--
-- Name: Sqs_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Sqs_instanceId_key" ON evolution."Sqs" USING btree ("instanceId");


--
-- Name: Template_name_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Template_name_key" ON evolution."Template" USING btree (name);


--
-- Name: Template_templateId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Template_templateId_key" ON evolution."Template" USING btree ("templateId");


--
-- Name: TypebotSetting_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "TypebotSetting_instanceId_key" ON evolution."TypebotSetting" USING btree ("instanceId");


--
-- Name: Webhook_instanceId_idx; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE INDEX "Webhook_instanceId_idx" ON evolution."Webhook" USING btree ("instanceId");


--
-- Name: Webhook_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Webhook_instanceId_key" ON evolution."Webhook" USING btree ("instanceId");


--
-- Name: Websocket_instanceId_key; Type: INDEX; Schema: evolution; Owner: bravapos_user
--

CREATE UNIQUE INDEX "Websocket_instanceId_key" ON evolution."Websocket" USING btree ("instanceId");


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: authtoken_token_key_10f0b77e_like; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX authtoken_token_key_10f0b77e_like ON public.authtoken_token USING btree (key varchar_pattern_ops);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: negocios_categoria_negocio_id_47ff3400; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_categoria_negocio_id_47ff3400 ON public.negocios_categoria USING btree (negocio_id);


--
-- Name: negocios_cliente_negocio_id_e0699b67; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_cliente_negocio_id_e0699b67 ON public.negocios_cliente USING btree (negocio_id);


--
-- Name: negocios_combopromocional_negocio_id_ba64c754; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_combopromocional_negocio_id_ba64c754 ON public.negocios_combopromocional USING btree (negocio_id);


--
-- Name: negocios_combopromocional_sede_id_231caac5; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_combopromocional_sede_id_231caac5 ON public.negocios_combopromocional USING btree (sede_id);


--
-- Name: negocios_componentecombo_combo_id_4fec86cf; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_componentecombo_combo_id_4fec86cf ON public.negocios_componentecombo USING btree (combo_id);


--
-- Name: negocios_componentecombo_opcion_seleccionada_id_34513892; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_componentecombo_opcion_seleccionada_id_34513892 ON public.negocios_componentecombo USING btree (opcion_seleccionada_id);


--
-- Name: negocios_componentecombo_producto_hijo_id_338a43e9; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_componentecombo_producto_hijo_id_338a43e9 ON public.negocios_componentecombo USING btree (producto_hijo_id);


--
-- Name: negocios_componentecombo_variacion_seleccionada_id_c5af9e73; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_componentecombo_variacion_seleccionada_id_c5af9e73 ON public.negocios_componentecombo USING btree (variacion_seleccionada_id);


--
-- Name: negocios_cuponpromocional_codigo_1b3f9109_like; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_cuponpromocional_codigo_1b3f9109_like ON public.negocios_cuponpromocional USING btree (codigo varchar_pattern_ops);


--
-- Name: negocios_cuponpromocional_negocio_id_114de448; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_cuponpromocional_negocio_id_114de448 ON public.negocios_cuponpromocional USING btree (negocio_id);


--
-- Name: negocios_detalleorden_orden_id_ad5683d6; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_detalleorden_orden_id_ad5683d6 ON public.negocios_detalleorden USING btree (orden_id);


--
-- Name: negocios_detalleorden_producto_id_37b07ef7; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_detalleorden_producto_id_37b07ef7 ON public.negocios_detalleorden USING btree (producto_id);


--
-- Name: negocios_detalleordenopcion_detalle_orden_id_9914ae04; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_detalleordenopcion_detalle_orden_id_9914ae04 ON public.negocios_detalleordenopcion USING btree (detalle_orden_id);


--
-- Name: negocios_detalleordenopcion_opcion_variacion_id_586441e7; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_detalleordenopcion_opcion_variacion_id_586441e7 ON public.negocios_detalleordenopcion USING btree (opcion_variacion_id);


--
-- Name: negocios_empleado_negocio_id_c19de66d; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_empleado_negocio_id_c19de66d ON public.negocios_empleado USING btree (negocio_id);


--
-- Name: negocios_empleado_rol_id_f67bdaee; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_empleado_rol_id_f67bdaee ON public.negocios_empleado USING btree (rol_id);


--
-- Name: negocios_empleado_sede_id_46d0b83d; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_empleado_sede_id_46d0b83d ON public.negocios_empleado USING btree (sede_id);


--
-- Name: negocios_grupovariacion_producto_id_2f231541; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_grupovariacion_producto_id_2f231541 ON public.negocios_grupovariacion USING btree (producto_id);


--
-- Name: negocios_horariovisibilidad_categoria_id_fc39d9ea; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_horariovisibilidad_categoria_id_fc39d9ea ON public.negocios_horariovisibilidad USING btree (categoria_id);


--
-- Name: negocios_horariovisibilidad_negocio_id_79317984; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_horariovisibilidad_negocio_id_79317984 ON public.negocios_horariovisibilidad USING btree (negocio_id);


--
-- Name: negocios_horariovisibilidad_opcion_variacion_id_44c8958d; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_horariovisibilidad_opcion_variacion_id_44c8958d ON public.negocios_horariovisibilidad USING btree (opcion_variacion_id);


--
-- Name: negocios_horariovisibilidad_producto_id_3aa9ce6e; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_horariovisibilidad_producto_id_3aa9ce6e ON public.negocios_horariovisibilidad USING btree (producto_id);


--
-- Name: negocios_horariovisibilidad_sede_id_34f4ef6d; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_horariovisibilidad_sede_id_34f4ef6d ON public.negocios_horariovisibilidad USING btree (sede_id);


--
-- Name: negocios_insumobase_negocio_id_c9c6c865; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_insumobase_negocio_id_c9c6c865 ON public.negocios_insumobase USING btree (negocio_id);


--
-- Name: negocios_insumosede_insumo_base_id_3e64aeb4; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_insumosede_insumo_base_id_3e64aeb4 ON public.negocios_insumosede USING btree (insumo_base_id);


--
-- Name: negocios_insumosede_sede_id_c5219438; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_insumosede_sede_id_c5219438 ON public.negocios_insumosede USING btree (sede_id);


--
-- Name: negocios_itemcombopromocio_variacion_seleccionada_id_33a8c1f2; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_itemcombopromocio_variacion_seleccionada_id_33a8c1f2 ON public.negocios_itemcombopromocional USING btree (variacion_seleccionada_id);


--
-- Name: negocios_itemcombopromocional_combo_id_7f99a799; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_itemcombopromocional_combo_id_7f99a799 ON public.negocios_itemcombopromocional USING btree (combo_id);


--
-- Name: negocios_itemcombopromocional_opcion_seleccionada_id_41207a49; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_itemcombopromocional_opcion_seleccionada_id_41207a49 ON public.negocios_itemcombopromocional USING btree (opcion_seleccionada_id);


--
-- Name: negocios_itemcombopromocional_producto_id_1ec90573; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_itemcombopromocional_producto_id_1ec90573 ON public.negocios_itemcombopromocional USING btree (producto_id);


--
-- Name: negocios_mesa_mesa_principal_id_ad4beeda; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_mesa_mesa_principal_id_ad4beeda ON public.negocios_mesa USING btree (mesa_principal_id);


--
-- Name: negocios_mesa_sede_id_6103f1a3; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_mesa_sede_id_6103f1a3 ON public.negocios_mesa USING btree (sede_id);


--
-- Name: negocios_mo_sesion__11f1d3_idx; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_mo_sesion__11f1d3_idx ON public.negocios_movimientocaja USING btree (sesion_caja_id, tipo);


--
-- Name: negocios_modificadorrapido_categoria_id_5c9a5afb; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_modificadorrapido_categoria_id_5c9a5afb ON public.negocios_modificadorrapido_categorias_aplicables USING btree (categoria_id);


--
-- Name: negocios_modificadorrapido_modificadorrapido_id_fe6814eb; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_modificadorrapido_modificadorrapido_id_fe6814eb ON public.negocios_modificadorrapido_categorias_aplicables USING btree (modificadorrapido_id);


--
-- Name: negocios_modificadorrapido_negocio_id_c70b8fcb; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_modificadorrapido_negocio_id_c70b8fcb ON public.negocios_modificadorrapido USING btree (negocio_id);


--
-- Name: negocios_movimientocaja_empleado_id_5ac04840; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_movimientocaja_empleado_id_5ac04840 ON public.negocios_movimientocaja USING btree (empleado_id);


--
-- Name: negocios_movimientocaja_sede_id_d78c0509; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_movimientocaja_sede_id_d78c0509 ON public.negocios_movimientocaja USING btree (sede_id);


--
-- Name: negocios_movimientocaja_sesion_caja_id_702561a0; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_movimientocaja_sesion_caja_id_702561a0 ON public.negocios_movimientocaja USING btree (sesion_caja_id);


--
-- Name: negocios_negocio_plan_id_216a9586; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_negocio_plan_id_216a9586 ON public.negocios_negocio USING btree (plan_id);


--
-- Name: negocios_negocio_ruc_03f40d77_like; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_negocio_ruc_03f40d77_like ON public.negocios_negocio USING btree (ruc varchar_pattern_ops);


--
-- Name: negocios_opcionvariacion_grupo_id_7f902db9; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_opcionvariacion_grupo_id_7f902db9 ON public.negocios_opcionvariacion USING btree (grupo_id);


--
-- Name: negocios_or_creado__a6b9ed_idx; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_or_creado__a6b9ed_idx ON public.negocios_orden USING btree (creado_en);


--
-- Name: negocios_or_sede_id_081dbb_idx; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_or_sede_id_081dbb_idx ON public.negocios_orden USING btree (sede_id, estado_pago);


--
-- Name: negocios_or_sede_id_e53660_idx; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_or_sede_id_e53660_idx ON public.negocios_orden USING btree (sede_id, estado);


--
-- Name: negocios_orden_mesa_id_71cd6c76; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_orden_mesa_id_71cd6c76 ON public.negocios_orden USING btree (mesa_id);


--
-- Name: negocios_orden_mesero_id_ee2705f7; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_orden_mesero_id_ee2705f7 ON public.negocios_orden USING btree (mesero_id);


--
-- Name: negocios_orden_sede_id_d4eb7105; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_orden_sede_id_d4eb7105 ON public.negocios_orden USING btree (sede_id);


--
-- Name: negocios_orden_sesion_caja_id_884a1182; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_orden_sesion_caja_id_884a1182 ON public.negocios_orden USING btree (sesion_caja_id);


--
-- Name: negocios_pa_orden_i_1963e4_idx; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_pa_orden_i_1963e4_idx ON public.negocios_pago USING btree (orden_id);


--
-- Name: negocios_pa_sesion__1dfabe_idx; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_pa_sesion__1dfabe_idx ON public.negocios_pago USING btree (sesion_caja_id, fecha_pago);


--
-- Name: negocios_pago_orden_id_5bd9af2e; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_pago_orden_id_5bd9af2e ON public.negocios_pago USING btree (orden_id);


--
-- Name: negocios_pago_sesion_caja_id_0264dfc2; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_pago_sesion_caja_id_0264dfc2 ON public.negocios_pago USING btree (sesion_caja_id);


--
-- Name: negocios_pr_negocio_1a9164_idx; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_pr_negocio_1a9164_idx ON public.negocios_producto USING btree (negocio_id, disponible);


--
-- Name: negocios_producto_categoria_id_53b28812; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_producto_categoria_id_53b28812 ON public.negocios_producto USING btree (categoria_id);


--
-- Name: negocios_producto_negocio_id_d77c41cd; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_producto_negocio_id_d77c41cd ON public.negocios_producto USING btree (negocio_id);


--
-- Name: negocios_promocionbot_cupon_id_214d3839; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_promocionbot_cupon_id_214d3839 ON public.negocios_promocionbot USING btree (cupon_id);


--
-- Name: negocios_promocionbot_sede_id_2dec80f5; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_promocionbot_sede_id_2dec80f5 ON public.negocios_promocionbot USING btree (sede_id);


--
-- Name: negocios_re_accion_b466d7_idx; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_re_accion_b466d7_idx ON public.negocios_registroauditoria USING btree (accion);


--
-- Name: negocios_re_sede_id_3e1eb9_idx; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_re_sede_id_3e1eb9_idx ON public.negocios_registroauditoria USING btree (sede_id, fecha);


--
-- Name: negocios_recetadetalle_insumo_id_dc774f33; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_recetadetalle_insumo_id_dc774f33 ON public.negocios_recetadetalle USING btree (insumo_id);


--
-- Name: negocios_recetadetalle_producto_id_18c773ba; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_recetadetalle_producto_id_18c773ba ON public.negocios_recetadetalle USING btree (producto_id);


--
-- Name: negocios_recetaopcion_insumo_id_eac3925f; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_recetaopcion_insumo_id_eac3925f ON public.negocios_recetaopcion USING btree (insumo_id);


--
-- Name: negocios_recetaopcion_opcion_id_6b9d0482; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_recetaopcion_opcion_id_6b9d0482 ON public.negocios_recetaopcion USING btree (opcion_id);


--
-- Name: negocios_registroauditoria_empleado_id_48bbcd97; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_registroauditoria_empleado_id_48bbcd97 ON public.negocios_registroauditoria USING btree (empleado_id);


--
-- Name: negocios_registroauditoria_orden_id_f5bd4faf; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_registroauditoria_orden_id_f5bd4faf ON public.negocios_registroauditoria USING btree (orden_id);


--
-- Name: negocios_registroauditoria_sede_id_ea106d1d; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_registroauditoria_sede_id_ea106d1d ON public.negocios_registroauditoria USING btree (sede_id);


--
-- Name: negocios_reglabot_sede_id_c271cc3c; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_reglabot_sede_id_c271cc3c ON public.negocios_reglabot USING btree (sede_id);


--
-- Name: negocios_reglanegocio_accion_categoria_id_b7f8b8fa; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_reglanegocio_accion_categoria_id_b7f8b8fa ON public.negocios_reglanegocio USING btree (accion_categoria_id);


--
-- Name: negocios_reglanegocio_accion_producto_id_a707323f; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_reglanegocio_accion_producto_id_a707323f ON public.negocios_reglanegocio USING btree (accion_producto_id);


--
-- Name: negocios_reglanegocio_negocio_id_200a45bf; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_reglanegocio_negocio_id_200a45bf ON public.negocios_reglanegocio USING btree (negocio_id);


--
-- Name: negocios_rol_nombre_ea90c1cb_like; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_rol_nombre_ea90c1cb_like ON public.negocios_rol USING btree (nombre varchar_pattern_ops);


--
-- Name: negocios_sede_bot_cumple_productos_producto_id_4df903a3; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_sede_bot_cumple_productos_producto_id_4df903a3 ON public.negocios_sede_bot_cumple_productos USING btree (producto_id);


--
-- Name: negocios_sede_bot_cumple_productos_sede_id_3543c7c8; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_sede_bot_cumple_productos_sede_id_3543c7c8 ON public.negocios_sede_bot_cumple_productos USING btree (sede_id);


--
-- Name: negocios_sede_negocio_id_62de1297; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_sede_negocio_id_62de1297 ON public.negocios_sede USING btree (negocio_id);


--
-- Name: negocios_sesioncaja_empleado_abre_id_9678bead; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_sesioncaja_empleado_abre_id_9678bead ON public.negocios_sesioncaja USING btree (empleado_abre_id);


--
-- Name: negocios_sesioncaja_empleado_cierra_id_67a5c8ee; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_sesioncaja_empleado_cierra_id_67a5c8ee ON public.negocios_sesioncaja USING btree (empleado_cierra_id);


--
-- Name: negocios_sesioncaja_sede_id_841c4c7b; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_sesioncaja_sede_id_841c4c7b ON public.negocios_sesioncaja USING btree (sede_id);


--
-- Name: negocios_solicitudcambio_orden_id_0844cf8c; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_solicitudcambio_orden_id_0844cf8c ON public.negocios_solicitudcambio USING btree (orden_id);


--
-- Name: negocios_suscripcion_plan_id_b0e0cc35; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_suscripcion_plan_id_b0e0cc35 ON public.negocios_suscripcion USING btree (plan_id);


--
-- Name: negocios_variacionproducto_producto_id_fa609db6; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_variacionproducto_producto_id_fa609db6 ON public.negocios_variacionproducto USING btree (producto_id);


--
-- Name: negocios_zonadelivery_sede_id_006d4f21; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX negocios_zonadelivery_sede_id_006d4f21 ON public.negocios_zonadelivery USING btree (sede_id);


--
-- Name: token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like ON public.token_blacklist_outstandingtoken USING btree (jti varchar_pattern_ops);


--
-- Name: token_blacklist_outstandingtoken_user_id_83bc629a; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE INDEX token_blacklist_outstandingtoken_user_id_83bc629a ON public.token_blacklist_outstandingtoken USING btree (user_id);


--
-- Name: unica_caja_abierta_por_sede; Type: INDEX; Schema: public; Owner: bravapos_user
--

CREATE UNIQUE INDEX unica_caja_abierta_por_sede ON public.negocios_sesioncaja USING btree (sede_id) WHERE ((estado)::text = 'abierta'::text);


--
-- Name: Chat Chat_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Chat"
    ADD CONSTRAINT "Chat_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Chatwoot Chatwoot_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Chatwoot"
    ADD CONSTRAINT "Chatwoot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contact Contact_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Contact"
    ADD CONSTRAINT "Contact_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DifySetting DifySetting_difyIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."DifySetting"
    ADD CONSTRAINT "DifySetting_difyIdFallback_fkey" FOREIGN KEY ("difyIdFallback") REFERENCES evolution."Dify"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DifySetting DifySetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."DifySetting"
    ADD CONSTRAINT "DifySetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Dify Dify_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Dify"
    ADD CONSTRAINT "Dify_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvoaiSetting EvoaiSetting_evoaiIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."EvoaiSetting"
    ADD CONSTRAINT "EvoaiSetting_evoaiIdFallback_fkey" FOREIGN KEY ("evoaiIdFallback") REFERENCES evolution."Evoai"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EvoaiSetting EvoaiSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."EvoaiSetting"
    ADD CONSTRAINT "EvoaiSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Evoai Evoai_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Evoai"
    ADD CONSTRAINT "Evoai_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvolutionBotSetting EvolutionBotSetting_botIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_botIdFallback_fkey" FOREIGN KEY ("botIdFallback") REFERENCES evolution."EvolutionBot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EvolutionBotSetting EvolutionBotSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."EvolutionBotSetting"
    ADD CONSTRAINT "EvolutionBotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EvolutionBot EvolutionBot_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."EvolutionBot"
    ADD CONSTRAINT "EvolutionBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FlowiseSetting FlowiseSetting_flowiseIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_flowiseIdFallback_fkey" FOREIGN KEY ("flowiseIdFallback") REFERENCES evolution."Flowise"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FlowiseSetting FlowiseSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."FlowiseSetting"
    ADD CONSTRAINT "FlowiseSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Flowise Flowise_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Flowise"
    ADD CONSTRAINT "Flowise_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IntegrationSession IntegrationSession_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."IntegrationSession"
    ADD CONSTRAINT "IntegrationSession_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Kafka Kafka_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Kafka"
    ADD CONSTRAINT "Kafka_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Label Label_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Label"
    ADD CONSTRAINT "Label_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Media Media_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Media"
    ADD CONSTRAINT "Media_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Media Media_messageId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Media"
    ADD CONSTRAINT "Media_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES evolution."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageUpdate MessageUpdate_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MessageUpdate MessageUpdate_messageId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."MessageUpdate"
    ADD CONSTRAINT "MessageUpdate_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES evolution."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Message"
    ADD CONSTRAINT "Message_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_sessionId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Message"
    ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES evolution."IntegrationSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: N8nSetting N8nSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."N8nSetting"
    ADD CONSTRAINT "N8nSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: N8nSetting N8nSetting_n8nIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."N8nSetting"
    ADD CONSTRAINT "N8nSetting_n8nIdFallback_fkey" FOREIGN KEY ("n8nIdFallback") REFERENCES evolution."N8n"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: N8n N8n_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."N8n"
    ADD CONSTRAINT "N8n_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Nats Nats_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Nats"
    ADD CONSTRAINT "Nats_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiBot OpenaiBot_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiBot OpenaiBot_openaiCredsId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."OpenaiBot"
    ADD CONSTRAINT "OpenaiBot_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES evolution."OpenaiCreds"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiCreds OpenaiCreds_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."OpenaiCreds"
    ADD CONSTRAINT "OpenaiCreds_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiSetting OpenaiSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OpenaiSetting OpenaiSetting_openaiCredsId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES evolution."OpenaiCreds"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OpenaiSetting OpenaiSetting_openaiIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."OpenaiSetting"
    ADD CONSTRAINT "OpenaiSetting_openaiIdFallback_fkey" FOREIGN KEY ("openaiIdFallback") REFERENCES evolution."OpenaiBot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Proxy Proxy_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Proxy"
    ADD CONSTRAINT "Proxy_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Pusher Pusher_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Pusher"
    ADD CONSTRAINT "Pusher_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Rabbitmq Rabbitmq_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Rabbitmq"
    ADD CONSTRAINT "Rabbitmq_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_sessionId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Session"
    ADD CONSTRAINT "Session_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Setting Setting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Setting"
    ADD CONSTRAINT "Setting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sqs Sqs_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Sqs"
    ADD CONSTRAINT "Sqs_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Template Template_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Template"
    ADD CONSTRAINT "Template_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TypebotSetting TypebotSetting_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TypebotSetting TypebotSetting_typebotIdFallback_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."TypebotSetting"
    ADD CONSTRAINT "TypebotSetting_typebotIdFallback_fkey" FOREIGN KEY ("typebotIdFallback") REFERENCES evolution."Typebot"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Typebot Typebot_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Typebot"
    ADD CONSTRAINT "Typebot_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Webhook Webhook_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Webhook"
    ADD CONSTRAINT "Webhook_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Websocket Websocket_instanceId_fkey; Type: FK CONSTRAINT; Schema: evolution; Owner: bravapos_user
--

ALTER TABLE ONLY evolution."Websocket"
    ADD CONSTRAINT "Websocket_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES evolution."Instance"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: authtoken_token authtoken_token_user_id_35299eff_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.authtoken_token
    ADD CONSTRAINT authtoken_token_user_id_35299eff_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_categoria negocios_categoria_negocio_id_47ff3400_fk_negocios_negocio_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_categoria
    ADD CONSTRAINT negocios_categoria_negocio_id_47ff3400_fk_negocios_negocio_id FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_cliente negocios_cliente_negocio_id_e0699b67_fk_negocios_negocio_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_cliente
    ADD CONSTRAINT negocios_cliente_negocio_id_e0699b67_fk_negocios_negocio_id FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_combopromocional negocios_combopromoc_negocio_id_ba64c754_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_combopromocional
    ADD CONSTRAINT negocios_combopromoc_negocio_id_ba64c754_fk_negocios_ FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_combopromocional negocios_combopromocional_sede_id_231caac5_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_combopromocional
    ADD CONSTRAINT negocios_combopromocional_sede_id_231caac5_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_componentecombo negocios_componentec_combo_id_4fec86cf_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_componentecombo
    ADD CONSTRAINT negocios_componentec_combo_id_4fec86cf_fk_negocios_ FOREIGN KEY (combo_id) REFERENCES public.negocios_producto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_componentecombo negocios_componentec_opcion_seleccionada__34513892_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_componentecombo
    ADD CONSTRAINT negocios_componentec_opcion_seleccionada__34513892_fk_negocios_ FOREIGN KEY (opcion_seleccionada_id) REFERENCES public.negocios_opcionvariacion(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_componentecombo negocios_componentec_producto_hijo_id_338a43e9_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_componentecombo
    ADD CONSTRAINT negocios_componentec_producto_hijo_id_338a43e9_fk_negocios_ FOREIGN KEY (producto_hijo_id) REFERENCES public.negocios_producto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_componentecombo negocios_componentec_variacion_selecciona_c5af9e73_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_componentecombo
    ADD CONSTRAINT negocios_componentec_variacion_selecciona_c5af9e73_fk_negocios_ FOREIGN KEY (variacion_seleccionada_id) REFERENCES public.negocios_variacionproducto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_cuponpromocional negocios_cuponpromoc_negocio_id_114de448_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_cuponpromocional
    ADD CONSTRAINT negocios_cuponpromoc_negocio_id_114de448_fk_negocios_ FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_detalleordenopcion negocios_detalleorde_detalle_orden_id_9914ae04_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_detalleordenopcion
    ADD CONSTRAINT negocios_detalleorde_detalle_orden_id_9914ae04_fk_negocios_ FOREIGN KEY (detalle_orden_id) REFERENCES public.negocios_detalleorden(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_detalleordenopcion negocios_detalleorde_opcion_variacion_id_586441e7_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_detalleordenopcion
    ADD CONSTRAINT negocios_detalleorde_opcion_variacion_id_586441e7_fk_negocios_ FOREIGN KEY (opcion_variacion_id) REFERENCES public.negocios_opcionvariacion(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_detalleorden negocios_detalleorde_producto_id_37b07ef7_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_detalleorden
    ADD CONSTRAINT negocios_detalleorde_producto_id_37b07ef7_fk_negocios_ FOREIGN KEY (producto_id) REFERENCES public.negocios_producto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_detalleorden negocios_detalleorden_orden_id_ad5683d6_fk_negocios_orden_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_detalleorden
    ADD CONSTRAINT negocios_detalleorden_orden_id_ad5683d6_fk_negocios_orden_id FOREIGN KEY (orden_id) REFERENCES public.negocios_orden(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_empleado negocios_empleado_negocio_id_c19de66d_fk_negocios_negocio_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_empleado
    ADD CONSTRAINT negocios_empleado_negocio_id_c19de66d_fk_negocios_negocio_id FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_empleado negocios_empleado_rol_id_f67bdaee_fk_negocios_rol_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_empleado
    ADD CONSTRAINT negocios_empleado_rol_id_f67bdaee_fk_negocios_rol_id FOREIGN KEY (rol_id) REFERENCES public.negocios_rol(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_empleado negocios_empleado_sede_id_46d0b83d_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_empleado
    ADD CONSTRAINT negocios_empleado_sede_id_46d0b83d_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_grupovariacion negocios_grupovariac_producto_id_2f231541_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_grupovariacion
    ADD CONSTRAINT negocios_grupovariac_producto_id_2f231541_fk_negocios_ FOREIGN KEY (producto_id) REFERENCES public.negocios_producto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_horariovisibilidad negocios_horariovisi_categoria_id_fc39d9ea_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_horariovisibilidad
    ADD CONSTRAINT negocios_horariovisi_categoria_id_fc39d9ea_fk_negocios_ FOREIGN KEY (categoria_id) REFERENCES public.negocios_categoria(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_horariovisibilidad negocios_horariovisi_negocio_id_79317984_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_horariovisibilidad
    ADD CONSTRAINT negocios_horariovisi_negocio_id_79317984_fk_negocios_ FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_horariovisibilidad negocios_horariovisi_opcion_variacion_id_44c8958d_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_horariovisibilidad
    ADD CONSTRAINT negocios_horariovisi_opcion_variacion_id_44c8958d_fk_negocios_ FOREIGN KEY (opcion_variacion_id) REFERENCES public.negocios_opcionvariacion(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_horariovisibilidad negocios_horariovisi_producto_id_3aa9ce6e_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_horariovisibilidad
    ADD CONSTRAINT negocios_horariovisi_producto_id_3aa9ce6e_fk_negocios_ FOREIGN KEY (producto_id) REFERENCES public.negocios_producto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_horariovisibilidad negocios_horariovisi_sede_id_34f4ef6d_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_horariovisibilidad
    ADD CONSTRAINT negocios_horariovisi_sede_id_34f4ef6d_fk_negocios_ FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_insumobase negocios_insumobase_negocio_id_c9c6c865_fk_negocios_negocio_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_insumobase
    ADD CONSTRAINT negocios_insumobase_negocio_id_c9c6c865_fk_negocios_negocio_id FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_insumosede negocios_insumosede_insumo_base_id_3e64aeb4_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_insumosede
    ADD CONSTRAINT negocios_insumosede_insumo_base_id_3e64aeb4_fk_negocios_ FOREIGN KEY (insumo_base_id) REFERENCES public.negocios_insumobase(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_insumosede negocios_insumosede_sede_id_c5219438_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_insumosede
    ADD CONSTRAINT negocios_insumosede_sede_id_c5219438_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_itemcombopromocional negocios_itemcombopr_combo_id_7f99a799_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_itemcombopromocional
    ADD CONSTRAINT negocios_itemcombopr_combo_id_7f99a799_fk_negocios_ FOREIGN KEY (combo_id) REFERENCES public.negocios_combopromocional(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_itemcombopromocional negocios_itemcombopr_opcion_seleccionada__41207a49_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_itemcombopromocional
    ADD CONSTRAINT negocios_itemcombopr_opcion_seleccionada__41207a49_fk_negocios_ FOREIGN KEY (opcion_seleccionada_id) REFERENCES public.negocios_opcionvariacion(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_itemcombopromocional negocios_itemcombopr_producto_id_1ec90573_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_itemcombopromocional
    ADD CONSTRAINT negocios_itemcombopr_producto_id_1ec90573_fk_negocios_ FOREIGN KEY (producto_id) REFERENCES public.negocios_producto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_itemcombopromocional negocios_itemcombopr_variacion_selecciona_33a8c1f2_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_itemcombopromocional
    ADD CONSTRAINT negocios_itemcombopr_variacion_selecciona_33a8c1f2_fk_negocios_ FOREIGN KEY (variacion_seleccionada_id) REFERENCES public.negocios_variacionproducto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_mesa negocios_mesa_mesa_principal_id_ad4beeda_fk_negocios_mesa_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_mesa
    ADD CONSTRAINT negocios_mesa_mesa_principal_id_ad4beeda_fk_negocios_mesa_id FOREIGN KEY (mesa_principal_id) REFERENCES public.negocios_mesa(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_mesa negocios_mesa_sede_id_6103f1a3_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_mesa
    ADD CONSTRAINT negocios_mesa_sede_id_6103f1a3_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_modificadorrapido_categorias_aplicables negocios_modificador_categoria_id_5c9a5afb_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_modificadorrapido_categorias_aplicables
    ADD CONSTRAINT negocios_modificador_categoria_id_5c9a5afb_fk_negocios_ FOREIGN KEY (categoria_id) REFERENCES public.negocios_categoria(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_modificadorrapido_categorias_aplicables negocios_modificador_modificadorrapido_id_fe6814eb_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_modificadorrapido_categorias_aplicables
    ADD CONSTRAINT negocios_modificador_modificadorrapido_id_fe6814eb_fk_negocios_ FOREIGN KEY (modificadorrapido_id) REFERENCES public.negocios_modificadorrapido(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_modificadorrapido negocios_modificador_negocio_id_c70b8fcb_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_modificadorrapido
    ADD CONSTRAINT negocios_modificador_negocio_id_c70b8fcb_fk_negocios_ FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_movimientocaja negocios_movimientoc_empleado_id_5ac04840_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_movimientocaja
    ADD CONSTRAINT negocios_movimientoc_empleado_id_5ac04840_fk_negocios_ FOREIGN KEY (empleado_id) REFERENCES public.negocios_empleado(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_movimientocaja negocios_movimientoc_sesion_caja_id_702561a0_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_movimientocaja
    ADD CONSTRAINT negocios_movimientoc_sesion_caja_id_702561a0_fk_negocios_ FOREIGN KEY (sesion_caja_id) REFERENCES public.negocios_sesioncaja(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_movimientocaja negocios_movimientocaja_sede_id_d78c0509_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_movimientocaja
    ADD CONSTRAINT negocios_movimientocaja_sede_id_d78c0509_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_negocio negocios_negocio_plan_id_216a9586_fk_negocios_plansaas_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_negocio
    ADD CONSTRAINT negocios_negocio_plan_id_216a9586_fk_negocios_plansaas_id FOREIGN KEY (plan_id) REFERENCES public.negocios_plansaas(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_negocio negocios_negocio_propietario_id_3d0b02e9_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_negocio
    ADD CONSTRAINT negocios_negocio_propietario_id_3d0b02e9_fk_auth_user_id FOREIGN KEY (propietario_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_opcionvariacion negocios_opcionvaria_grupo_id_7f902db9_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_opcionvariacion
    ADD CONSTRAINT negocios_opcionvaria_grupo_id_7f902db9_fk_negocios_ FOREIGN KEY (grupo_id) REFERENCES public.negocios_grupovariacion(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_orden negocios_orden_mesa_id_71cd6c76_fk_negocios_mesa_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_orden
    ADD CONSTRAINT negocios_orden_mesa_id_71cd6c76_fk_negocios_mesa_id FOREIGN KEY (mesa_id) REFERENCES public.negocios_mesa(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_orden negocios_orden_mesero_id_ee2705f7_fk_negocios_empleado_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_orden
    ADD CONSTRAINT negocios_orden_mesero_id_ee2705f7_fk_negocios_empleado_id FOREIGN KEY (mesero_id) REFERENCES public.negocios_empleado(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_orden negocios_orden_sede_id_d4eb7105_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_orden
    ADD CONSTRAINT negocios_orden_sede_id_d4eb7105_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_orden negocios_orden_sesion_caja_id_884a1182_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_orden
    ADD CONSTRAINT negocios_orden_sesion_caja_id_884a1182_fk_negocios_ FOREIGN KEY (sesion_caja_id) REFERENCES public.negocios_sesioncaja(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_pago negocios_pago_orden_id_5bd9af2e_fk_negocios_orden_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_pago
    ADD CONSTRAINT negocios_pago_orden_id_5bd9af2e_fk_negocios_orden_id FOREIGN KEY (orden_id) REFERENCES public.negocios_orden(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_pago negocios_pago_sesion_caja_id_0264dfc2_fk_negocios_sesioncaja_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_pago
    ADD CONSTRAINT negocios_pago_sesion_caja_id_0264dfc2_fk_negocios_sesioncaja_id FOREIGN KEY (sesion_caja_id) REFERENCES public.negocios_sesioncaja(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_producto negocios_producto_categoria_id_53b28812_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_producto
    ADD CONSTRAINT negocios_producto_categoria_id_53b28812_fk_negocios_ FOREIGN KEY (categoria_id) REFERENCES public.negocios_categoria(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_producto negocios_producto_negocio_id_d77c41cd_fk_negocios_negocio_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_producto
    ADD CONSTRAINT negocios_producto_negocio_id_d77c41cd_fk_negocios_negocio_id FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_promocionbot negocios_promocionbo_cupon_id_214d3839_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_promocionbot
    ADD CONSTRAINT negocios_promocionbo_cupon_id_214d3839_fk_negocios_ FOREIGN KEY (cupon_id) REFERENCES public.negocios_cuponpromocional(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_promocionbot negocios_promocionbot_sede_id_2dec80f5_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_promocionbot
    ADD CONSTRAINT negocios_promocionbot_sede_id_2dec80f5_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_recetadetalle negocios_recetadetal_insumo_id_dc774f33_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_recetadetalle
    ADD CONSTRAINT negocios_recetadetal_insumo_id_dc774f33_fk_negocios_ FOREIGN KEY (insumo_id) REFERENCES public.negocios_insumobase(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_recetadetalle negocios_recetadetal_producto_id_18c773ba_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_recetadetalle
    ADD CONSTRAINT negocios_recetadetal_producto_id_18c773ba_fk_negocios_ FOREIGN KEY (producto_id) REFERENCES public.negocios_producto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_recetaopcion negocios_recetaopcio_insumo_id_eac3925f_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_recetaopcion
    ADD CONSTRAINT negocios_recetaopcio_insumo_id_eac3925f_fk_negocios_ FOREIGN KEY (insumo_id) REFERENCES public.negocios_insumobase(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_recetaopcion negocios_recetaopcio_opcion_id_6b9d0482_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_recetaopcion
    ADD CONSTRAINT negocios_recetaopcio_opcion_id_6b9d0482_fk_negocios_ FOREIGN KEY (opcion_id) REFERENCES public.negocios_opcionvariacion(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_registroauditoria negocios_registroaud_empleado_id_48bbcd97_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_registroauditoria
    ADD CONSTRAINT negocios_registroaud_empleado_id_48bbcd97_fk_negocios_ FOREIGN KEY (empleado_id) REFERENCES public.negocios_empleado(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_registroauditoria negocios_registroaud_orden_id_f5bd4faf_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_registroauditoria
    ADD CONSTRAINT negocios_registroaud_orden_id_f5bd4faf_fk_negocios_ FOREIGN KEY (orden_id) REFERENCES public.negocios_orden(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_registroauditoria negocios_registroauditoria_sede_id_ea106d1d_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_registroauditoria
    ADD CONSTRAINT negocios_registroauditoria_sede_id_ea106d1d_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_reglabot negocios_reglabot_sede_id_c271cc3c_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_reglabot
    ADD CONSTRAINT negocios_reglabot_sede_id_c271cc3c_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_reglanegocio negocios_reglanegoci_accion_categoria_id_b7f8b8fa_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_reglanegocio
    ADD CONSTRAINT negocios_reglanegoci_accion_categoria_id_b7f8b8fa_fk_negocios_ FOREIGN KEY (accion_categoria_id) REFERENCES public.negocios_categoria(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_reglanegocio negocios_reglanegoci_accion_producto_id_a707323f_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_reglanegocio
    ADD CONSTRAINT negocios_reglanegoci_accion_producto_id_a707323f_fk_negocios_ FOREIGN KEY (accion_producto_id) REFERENCES public.negocios_producto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_reglanegocio negocios_reglanegoci_negocio_id_200a45bf_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_reglanegocio
    ADD CONSTRAINT negocios_reglanegoci_negocio_id_200a45bf_fk_negocios_ FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_sede_bot_cumple_productos negocios_sede_bot_cu_producto_id_4df903a3_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sede_bot_cumple_productos
    ADD CONSTRAINT negocios_sede_bot_cu_producto_id_4df903a3_fk_negocios_ FOREIGN KEY (producto_id) REFERENCES public.negocios_producto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_sede_bot_cumple_productos negocios_sede_bot_cu_sede_id_3543c7c8_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sede_bot_cumple_productos
    ADD CONSTRAINT negocios_sede_bot_cu_sede_id_3543c7c8_fk_negocios_ FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_sede negocios_sede_negocio_id_62de1297_fk_negocios_negocio_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sede
    ADD CONSTRAINT negocios_sede_negocio_id_62de1297_fk_negocios_negocio_id FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_sesioncaja negocios_sesioncaja_empleado_abre_id_9678bead_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sesioncaja
    ADD CONSTRAINT negocios_sesioncaja_empleado_abre_id_9678bead_fk_negocios_ FOREIGN KEY (empleado_abre_id) REFERENCES public.negocios_empleado(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_sesioncaja negocios_sesioncaja_empleado_cierra_id_67a5c8ee_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sesioncaja
    ADD CONSTRAINT negocios_sesioncaja_empleado_cierra_id_67a5c8ee_fk_negocios_ FOREIGN KEY (empleado_cierra_id) REFERENCES public.negocios_empleado(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_sesioncaja negocios_sesioncaja_sede_id_841c4c7b_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_sesioncaja
    ADD CONSTRAINT negocios_sesioncaja_sede_id_841c4c7b_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_solicitudcambio negocios_solicitudcambio_orden_id_0844cf8c_fk_negocios_orden_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_solicitudcambio
    ADD CONSTRAINT negocios_solicitudcambio_orden_id_0844cf8c_fk_negocios_orden_id FOREIGN KEY (orden_id) REFERENCES public.negocios_orden(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_suscripcion negocios_suscripcion_negocio_id_641d6144_fk_negocios_negocio_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_suscripcion
    ADD CONSTRAINT negocios_suscripcion_negocio_id_641d6144_fk_negocios_negocio_id FOREIGN KEY (negocio_id) REFERENCES public.negocios_negocio(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_suscripcion negocios_suscripcion_plan_id_b0e0cc35_fk_negocios_plansaas_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_suscripcion
    ADD CONSTRAINT negocios_suscripcion_plan_id_b0e0cc35_fk_negocios_plansaas_id FOREIGN KEY (plan_id) REFERENCES public.negocios_plansaas(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_variacionproducto negocios_variacionpr_producto_id_fa609db6_fk_negocios_; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_variacionproducto
    ADD CONSTRAINT negocios_variacionpr_producto_id_fa609db6_fk_negocios_ FOREIGN KEY (producto_id) REFERENCES public.negocios_producto(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: negocios_zonadelivery negocios_zonadelivery_sede_id_006d4f21_fk_negocios_sede_id; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.negocios_zonadelivery
    ADD CONSTRAINT negocios_zonadelivery_sede_id_006d4f21_fk_negocios_sede_id FOREIGN KEY (sede_id) REFERENCES public.negocios_sede(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk FOREIGN KEY (token_id) REFERENCES public.token_blacklist_outstandingtoken(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outs_user_id_83bc629a_fk_auth_user; Type: FK CONSTRAINT; Schema: public; Owner: bravapos_user
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outs_user_id_83bc629a_fk_auth_user FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

\unrestrict dubzsIKtWbBdPqUJBqyRud9hXwHwRbdY245GIy4apijwPSrQAF7v7X5ebS3Zjrl

