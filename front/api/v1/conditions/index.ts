type Condition = {
  id: string;
  templeture: number;
  humidity: number;
};

export type Methods = {
  post: {
    reqBody: Condition;
    resBody: {};
  };
};
