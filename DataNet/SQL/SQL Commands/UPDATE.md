# UPDATE
*tags:* #database, #sql, #DBdml 
*description:* изменение данных в существующих строках.

---

## Шаблон:
```sql
UPDATE table_name
SET
column(s) = value(s)
WHERE conditions(s);
```

Пример:
```sql
update EMPLOYEES set salary = 300, job_id = 'IT_PROG' where EMPLOYEE_ID = 102;

update EMPLOYEES set salary = 6000 where EMPLOYEE_ID < 105;
```

**Если не указать условия, то будут изменены значения всех строк в данной таблице!**
```sql
update employees set salary = 8000;
``` 
Если вы случайно это сделали, можно откатить это действие с помощью [[ROLLBACK]].

## Subquery
Подробнее: [[Subquery SQL]]

Шаблон:
```sql
UPDATE table_name
SET
column(s) = subqery(s)
WHERE column = subquery;
```

Пример:
```sql
update EMPLOYEES
set SALARY = 5000
    where DEPARTMENT_ID in (select DEPARTMENT_ID from DEPARTMENTS where DEPARTMENT_NAME = 'Marketing')
```