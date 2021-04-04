# SQL commands
*необходимо знать:* [[Администрироване DB]]
*теги:* #sql #базы_данных 
*описание:*

---
**SQL команды подразделяются на несколько видов:**
-  DML - команды, работающие с информацией внутри таблиц.
- DDL - команды, работающие не с данными в таблицах, а с самими таблицами, а точнее с их структруторй.
- TCL - контроль транзакций.
- DCL - управление правами доступа 


### DML (Data Manipulation Language), #sql/command/DBdml
`SELECT` - выборка из таблиц. ([[SELECT]])
`INSERT` - вставка строк в таблицы. ([[INSERT]])
`UPDATE` - изменение данных в таблицах. ([[UPDATE]])
`DELETE` - удаление строк в таблицах. ([[DELETE]])
`MERGE` - объединение команд. ([[MERGE]])

### DDL (Data Definition Language), #sql/command/DBddl
`CREATE` - создание таблиц. ([[CREATE]])
`ALTER` - изменение струтуры, добавление столбцов. ([[ALTER]])
`DROP` - удаление объектов. ([[DROP]])
`RENAME` - изменение имен столбцов. ([[$ RENAME]])
`TRUNCATE` - удаление содержимого таблицы, но не таблицы. ([[TRUNCATE]])

### TCL (Transaction Control Language), #sql/command/DBtcl
`COMMIT` - подтвердить. ([[COMMIT]])
`ROLLBACK` - откатить. ([[ROLLBACK]])
`SAVEPOINT` - точка сохранения. ([[SAVEPOINT]])

### DCL (Data Control Language), #sql/command/DBdcl
`GRANT` - выдать права. ([[$ GRANT]])
`REVOKE` - отобрать права. ([[$ REVOKE]])



