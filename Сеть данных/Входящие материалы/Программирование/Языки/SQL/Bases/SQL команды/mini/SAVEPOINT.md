# SAVEPOINT
*теги:* #базы_данных, #sql/command/DBtcl 
*описание:* точка сохранения, к которой можно откатиться с помощью [[ROLLBACK]].

---
**Шаблон:**
>SAVEPOINT savepoint_name

```sql
savepoint p1;
update NEW_EMPS set NAME = 'Hello';
savepoint p2;
delete from NEW_EMPS where EMP_ID < 200;
rollback to savepoint p2;
```