# INSERT
*tegs:* #database, #sql, #DBdml 
*description:* вставка строк в таблицы.

---
Во всех таблицах есть правила, по которым в них можно вставить информацию. Эти правила назваются ==constraint==. 
Например зарплата может содержать только положительные значения, или нельзя не заполнять значения атрибута EMAIL.

## Шаблон
>INSERT INTO table_name
column(s)
VALUES(value(s));

**Рекомендуемый формат.** Рекомендуется использовать функции и явно указываеть, какие значения мы вносим:
```sql
insert into EMPLOYEES (EMPLOYEE_ID, LAST_NAME, EMAIL, HIRE_DATE, JOB_ID)
    values ((select MAX(EMPLOYEE_ID) from EMPLOYEES) + 1, INITCAP('tregulov'), UPPER('tregulov1'),
            TO_DATE('18-SEP-2019', 'dd-MON-YYYY'), UPPER('IT_PROG'));

insert into EMPLOYEES (EMPLOYEE_ID, LAST_NAME, EMAIL, HIRE_DATE, JOB_ID)
    values ((select MAX(EMPLOYEE_ID) from EMPLOYEES) + 1, INITCAP('tregulov'), UPPER('tregulov2'),
            sysdate, UPPER('IT_PROG'));
```

Мы можем вставлять строки по порядку, который есть в таблице:
```sql
insert into COUNTRIES
	VALUES ('SW', 'Sweden', 1);
```

Надо указывать порядок, в котором мы добавляем значеня. Это также позволяет изменить порядок. К тому же
```sql
insert into COUNTRIES (REGION_ID, COUNTRY_NAME, COUNTRY_ID) VALUES (1, 'Greece', 'GR');
```

Можно также вставлять не все значения или значения null, если столбец позволяет это:
```sql
insert into COUNTRIES (COUNTRY_ID, COUNTRY_NAME) VALUES ('PR', 'Portugal');
insert into COUNTRIES values ('FL', 'Finland', null)
```

## SUBQUERY
Разрешено использовать подзапросы для формирования таблиц. Типы должны быть совместимы.
([[Subquery SQL]])

**Шаблон:**
```sql
INSERT INTO table_name
columnt(s)
SUQBUERY;
```

Пример:
```sql
insert into NEW_EMPS (emp_id, name, start_date)
select EMPLOYEE_ID, FIRST_NAME, HIRE_DATE from EMPLOYEES where EMPLOYEE_ID > 200;
```

### Вставка с помощью insert all
```sql
insert all
    when DEPARTMENT_ID = 100 then
    into EMPS_WITH_DEPT_100
    values (FIRST_NAME, SALARY)
        when SALARY > 15000 then
    into EMPS_WITH_HIGH_SALARY (name)
    values (LAST_NAME)
        when 5 = 5 then
    into SOME_EMPS (name, salary)
    values (FIRST_NAME, SALARY)
select FIRST_NAME, LAST_NAME, SALARY, DEPARTMENT_ID
    from EMPLOYEES
    where LENGTH(FIRST_NAME) > 5;
```