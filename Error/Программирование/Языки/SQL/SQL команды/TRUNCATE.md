# TRUNCATE
*теги:* #базы_данных, #sql, #sql/command/DBddl 
*описание:* удаление всех строк таблицы. **После использования этой команды нельзя выполнить rollback.**

---
**Template:**
>TRUNCATE TABLE `schema.`table_name;

```sql
TRUNCATE TABLE STUDENTS;
```

В отличие от delete эта команда немного другим способом удаляет строки, может удалять любые строки и в ней нельзя делать rollback.