import * as oracledb from "oracledb";

export abstract class EtaTable {

    protected oracleConn: oracledb.IConnection;

    public constructor(conn: oracledb.IConnection) {
        this.oracleConn = conn;
    }

    public abstract shouldIgnoreDuplicates(): boolean;
    public abstract requiresTerm(): boolean;
    public abstract fetch(term: string, callback: (err: Error, rows?: any[]) => void): void;
}
