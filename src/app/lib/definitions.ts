
export type Event = {
    _id: string,
    name: string,
    startDate: ISODate | ISODatetime,
    endDate?: ISODate | ISODatetime,
    genre?: string,
    venue?: string,
    organizer?: {
        name: string,
    },
    url?: string,
    numLikes?: number,
    latitude?: number,
    longitude?: number,
    embedding?: number[];
};

export type Like = {
    userId: string,
    eventId: string, // Unique identifier for the event entry
};

export type Organization = {
    name: string,
    eventApiType: string,
    api: string,
    jsonLdLinkBlockList?: string[];
    jsonLdEventLinkMustInclude?: string;
};

type ISODate = string; // Expected format: YYYY-MM-DD
type ISODatetime = string; // Expected format: YYYY-MM-DDTHH:mm:ss.sssZ
