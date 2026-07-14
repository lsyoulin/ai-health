-- 知食数据库初始化
-- 启用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- pg_trgm 用于食物名称模糊搜索（ILIKE 优化）
-- 注意：Prisma migrate 会创建表，这里仅做扩展与初始化
