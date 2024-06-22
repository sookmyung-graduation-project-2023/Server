import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const AWS_REGION = process.env.AWS_REGION;

const ddbClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const get = async (data) => {
    try{
        const getCommand = new GetCommand(data);
        const response = await docClient.send(getCommand);
        return response;
    }catch (error){
        throw error;
    };
};

const put = async (data) =>{
    try{
        const putCommand = new PutCommand(data);
        const response = await docClient.send(putCommand);
        return response;
    }catch(error){
        throw error;
    };
};

const update = async (data) =>{
    try{
        const updateCommand = new UpdateCommand(data);
        const response = await docClient.send(updateCommand);
        return response;
    }catch(error){
        throw error;
    };
};

const query = async (data) =>{
    try{
        const queryCommand = new QueryCommand(data);
        const response = await docClient.send(queryCommand);
        return response;
    }catch(error){
        throw error;
    };
};

export default {
    get,
    put,
    update,
    query
};