# JR泰拳馆签到系统

JR泰拳馆签到系统是一个用于管理会员签到的 Web 应用，旨在简化会员签到流程、提升管理效率，并为管理员提供数据统计和分析功能。

详细的项目文档请查看 [docs/readme.md](docs/readme.md)

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9
- Docker（用于本地开发）

### 安装和运行
1. 克隆项目
```bash
git clone https://github.com/jhholy/JR_checkin_1226.git
cd JR_checkin_1226
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
复制 `.env.example` 到 `.env` 并填写必要的配置信息。

4. 启动开发服务器
```bash
npm run dev
```

## 第三方服务信息

### GitHub 仓库
- 仓库名称：JR_checkin_1226
- 仓库地址：https://github.com/jhholy/JR_checkin_1226.git

### Supabase 项目
- 项目 ID：ewjawtisnreuqmzutnnv
- 项目 URL：https://supabase.com/dashboard/project/ewjawtisnreuqmzutnnv

### 数据库连接信息
#### 直接连接
```
postgresql://postgres:[YOUR-PASSWORD]@db.ewjawtisnreuqmzutnnv.supabase.co:5432/postgres
```

#### 连接池（Transaction Pooler）
```
postgresql://postgres.ewjawtisnreuqmzutnnv:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

## 项目结构
- `docs/` - 详细的项目文档
- `src/` - 源代码目录
- `supabase/` - Supabase 配置和迁移文件
- `backups/` - 数据库备份文件

## 技术栈
- 前端：React + TypeScript
- 后端：Supabase（基于 PostgreSQL）
- 数据库：PostgreSQL
- 开发工具：Docker（用于本地开发环境）

## 作者
Hongyi Ji (hongyiji224@gmail.com) 