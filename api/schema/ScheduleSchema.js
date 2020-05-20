import { Schedule, ScheduleTC, UserTC, SessionTC } from '../models';

/**
 * Relations (necessary for any fields that link to other types in the schema)
 * https://graphql-compose.github.io/docs/plugins/plugin-mongoose.html#how-to-build-nesting-relations
 */
ScheduleTC.addRelation("user", {
    "resolver": () => UserTC.getResolver('findById'),
    prepareArgs: {
        _id: (source) => source.user,
    },
    projection: { user: 1 }
});

/**
 * Add relation for a nested field: https://github.com/graphql-compose/graphql-compose/issues/2
 * But the .getByPath(path) method doesn't exist anymore, so to get the TypeComposer of the nested field (in this case, "items")
 * We need to use .getFieldTC(path)
 */
const DraftSessionTC = ScheduleTC.getFieldTC("draftSessions");
DraftSessionTC.addRelation("session", {
    "resolver": () => SessionTC.getResolver("findById"),
    prepareArgs: {
        _id: (source) => source.session
    },
    projection: { session: 1 }
});

/**
 * Custom Resolvers
 */

/**
 * Used to find all schedules for a particular user
 */
ScheduleTC.addResolver({
    name: "findManyByUser",
    type: [ScheduleTC],
    args: { _id: "ID!" },
    resolve: async ({ source, args, context, info }) => {
        return await Schedule.find({ user: args._id });
    }
})

/**
  * Used to update the draft sessions for a schedule
  * Can either add or remove a session from their draft sessions
  */
 ScheduleTC.addResolver({
    name: "scheduleUpdateDraftSessions",
    type: ScheduleTC,
    // day is an enum, so we want to get its enum from the model directly
    args: { scheduleID: "ID!", push: "Boolean", sessionID: "ID!" },
    resolve: async ({ source, args, context, info }) => {
        // This determines whether we add or remove from the array
        let operation = args.push ? "$addToSet" : "$pull";
        // Setup update based on operation
        let update = {}
        update[operation] = { draftSessions: { visible: true, session: args.sessionID } };
        // Execute update
        const schedule = await Schedule.updateOne(
            { _id: args.scheduleID }, // find Vendor by id
            update
        );
        if (!schedule) return null; 
        return Schedule.findById(args.scheduleID); // Finally return the new schedule object
    }
});

/**
 * Toggles the session visibility, given a schedule and a session ID
 */
ScheduleTC.addResolver({
    name: "scheduleToggleSession",
    type: ScheduleTC,
    args: { scheduleID: "ID!", sessionID: "ID!" },
    resolve: async ({ source, args, context, info }) => {
        let options = {
            upsert: false,
            new: true,
            arrayFilters: [ { "elem.session": args.sessionID } ]
        }
        // Perform update
        await Schedule.updateOne(
            { _id: args.scheduleID },
            { $bit: { "draftSessions.$[elem].visible": { xor: parseInt("1") } } },
            options
        );
        // Return schedule
        return await Schedule.findById(args.scheduleID);
    }
})

const ScheduleQuery = {
    scheduleOne: ScheduleTC.getResolver('findOne')
};

const ScheduleMutation = {
    scheduleCreateOne: ScheduleTC.getResolver('createOne'),
    scheduleToggleSession: ScheduleTC.getResolver("scheduleToggleSession"),
    scheduleAddSession: ScheduleTC.getResolver('scheduleUpdateDraftSessions').wrapResolve(next => rp => {
        rp.args.push = true;
        return next(rp);
    }),
    scheduleRemoveSession: ScheduleTC.getResolver('scheduleUpdateDraftSessions').wrapResolve(next => rp => {
        rp.args.push = false;
        return next(rp);
    }),
};

export { ScheduleQuery, ScheduleMutation };