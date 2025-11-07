import mongoose, { Document, Schema } from 'mongoose';

// 定义人格模型实例接口
interface PersonaInstance extends Document {
    userId: string;
    name: string; // 实例名称
    description?: string; // 实例描述
    personaCode?: string; // 关联的MBTI人格代码（可选，空白模板则为空）
    systemPrompt?: string; // 系统提示词（可选，如果使用预制人格则从预制加载）
    trainingSamples: { // 训练样本
        input: string;
        response: string;
        scenario?: string;
    }[];
    modelParams: { // 模型参数
        temperature: number;
        topP: number;
        topK: number;
        maxTokens: number;
        epochs: number;
        learningRate: number;
    };
    isTrained: boolean; // 是否已训练
    trainingStatus?: 'idle' | 'training' | 'completed' | 'error'; // 训练状态
    avatarUrl?: string; // 头像URL
    tags?: string[]; // 标签
    isPublic?: boolean; // 是否公开
    isTrainingSetPublic?: boolean; // 训练集是否公开可见（仅当实例公开时有效）
    // 收藏相关字段
    sourceInstanceId?: string; // 来源实例ID（如果是收藏的）
    sourceUserId?: string; // 来源用户ID
    isForked?: boolean; // 是否是从其他实例fork的
    isInvalid?: boolean; // 是否无效（原实例变为非公开）
    modifiedAt?: Date; // 修改时间（用于判断是否二次开发过）
    // 开发层级相关字段
    developmentLevel?: number; // 开发层级（1=原创, 2=二次开发, 3=三次开发等）
    originalUserId?: string; // 原始作者ID
    originalUserName?: string; // 原始作者名称（用于显示）
    forkChain?: string[]; // 开发链（记录所有开发层级的实例ID）
    createdAt: Date;
    updatedAt: Date;
}

// 定义人格模型实例的 Schema
const personaInstanceSchema = new Schema<PersonaInstance>({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    personaCode: { type: String, index: true, sparse: true }, // 可选，空白模板为空
    systemPrompt: String, // 可选，如果使用预制人格则从预制加载
    trainingSamples: [{
        input: { type: String, required: true },
        response: { type: String, required: true },
        scenario: String,
    }],
    modelParams: {
        temperature: { type: Number, default: 0.7 },
        topP: { type: Number, default: 0.9 },
        topK: { type: Number, default: 50 },
        maxTokens: { type: Number, default: 200 },
        epochs: { type: Number, default: 3 },
        learningRate: { type: Number, default: 0.001 }
    },
    isTrained: { type: Boolean, default: false },
    trainingStatus: { 
        type: String, 
        enum: ['idle', 'training', 'completed', 'error'], 
        default: 'idle' 
    },
    avatarUrl: String,
    tags: [String],
    isPublic: { type: Boolean, default: false },
    isTrainingSetPublic: { type: Boolean, default: true }, // 默认公开训练集
    // 收藏相关字段
    sourceInstanceId: { type: String, index: true, sparse: true }, // 来源实例ID
    sourceUserId: { type: String, index: true, sparse: true }, // 来源用户ID
    isForked: { type: Boolean, default: false }, // 是否是从其他实例fork的
    isInvalid: { type: Boolean, default: false }, // 是否无效
    modifiedAt: { type: Date }, // 修改时间
    // 开发层级相关字段
    developmentLevel: { type: Number, default: 1 }, // 开发层级（1=原创, 2=二次开发, 3=三次开发等）
    originalUserId: { type: String, index: true, sparse: true }, // 原始作者ID
    originalUserName: { type: String }, // 原始作者名称
    forkChain: [String], // 开发链（记录所有开发层级的实例ID）
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// 更新时间戳
personaInstanceSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    // 如果是fork的实例且被修改过，更新modifiedAt
    if (this.isForked && this.isModified() && !this.isNew) {
        this.modifiedAt = new Date();
    }
    next();
});

// 创建并导出模型
const PersonaInstance = mongoose.models.PersonaInstance || mongoose.model('PersonaInstance', personaInstanceSchema);

export default PersonaInstance;

